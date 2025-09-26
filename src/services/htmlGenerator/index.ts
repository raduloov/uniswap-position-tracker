import * as fs from "fs/promises";
import * as path from "path";
import { TIMEZONE } from "../../constants";
import { PortfolioMetrics, PositionData } from "../../types";
import { DataFetcher } from "../dataFetcher";

import { generateStyles } from "./styles";
import { generateTokenPairSVG, getTokenIcon } from "../../utils/tokenPairLogo";
import { PositionMetricsCalculator } from "../positionMetricsCalculator";
import {
  calculateFeeDifference,
  calculateTotalValueDifference,
  calculatePriceDifference,
  formatFeeDifference,
  formatTotalValueWithChange,
  formatPriceWithChange,
  isPositionInRange,
  formatStatusBadge,
  formatTableDate
} from "../../utils/htmlGenerator";
import { formatPercentageWithClass } from "../../utils/formatting";
import { getLivePositionData } from "../../utils/livePosition";

export class HtmlGenerator {
  private htmlFilePath: string;
  private dataFetcher: DataFetcher;

  constructor(htmlFilePath: string, dataFilePath: string) {
    this.htmlFilePath = htmlFilePath;
    this.dataFetcher = new DataFetcher(dataFilePath);
  }

  async generatePositionReport(): Promise<void> {
    // Load all historical data
    const allData = await this.loadAllPositionData();
    const latestHourlyData = await this.loadLatestHourlyData();
    const html = this.buildHtml(allData, latestHourlyData);

    const dir = path.dirname(this.htmlFilePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.htmlFilePath, html, "utf-8");
    console.log(`📄 HTML report generated: ${this.htmlFilePath}`);
  }

  private async loadAllPositionData(): Promise<PositionData[]> {
    try {
      return await this.dataFetcher.fetchAllPositionData();
    } catch (error) {
      console.error("Error loading position data:", error);
      return [];
    }
  }

  private async loadLatestHourlyData(): Promise<PositionData[] | null> {
    try {
      return await this.dataFetcher.fetchLatestHourlyPosition();
    } catch (error) {
      console.error("Error loading hourly data:", error);
      return null;
    }
  }

  private buildHtml(allData: PositionData[], latestHourlyData: PositionData[] | null): string {
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: TIMEZONE.SOFIA
    });
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE.SOFIA
    });
    const formattedDateTime = `${currentDate} at ${currentTime}`;

    // Group positions by positionId
    const positionGroups = this.groupPositionsByIds(allData);

    // Get live position data handler
    const livePositionData = getLivePositionData(latestHourlyData, positionGroups);

    // Calculate all metrics using centralized calculator
    const metricsCalculator = new PositionMetricsCalculator();

    // Combine daily and hourly data for complete P/L calculation
    let combinedData = [...allData];
    if (latestHourlyData && latestHourlyData.length > 0) {
      // Add hourly data to the combined dataset for accurate P/L calculation
      combinedData.push(...latestHourlyData);
    }

    // Calculate portfolio metrics with proper current and previous positions
    const portfolioMetrics = metricsCalculator.calculatePortfolioMetrics(
      combinedData,
      livePositionData.currentPositions,
      livePositionData.previousPositionsFor24h
    );

    const dashboardSection = this.buildDashboardSection(portfolioMetrics.dashboard);

    const positionTables = Array.from(positionGroups.entries())
      // Sort position groups by most recent activity (newest first)
      .sort(([, positionsA], [, positionsB]) => {
        const latestA = positionsA[0]?.timestamp || "";
        const latestB = positionsB[0]?.timestamp || "";
        return new Date(latestB).getTime() - new Date(latestA).getTime();
      })
      .map(([positionId, positions]) => {
        // Get position-specific table data
        const tableData = livePositionData.getPositionTableData(positionId, positions);

        return this.buildPositionHistoryTable(
          positionId,
          tableData.historicalPositions,
          portfolioMetrics,
          tableData.livePosition,
          tableData.referenceFor24h
        );
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uniswap Position Tracker - ${currentDate}</title>
    <link rel="icon" href="assets/uniswap-logo.svg">
    <style>
${generateStyles()}
    </style>
    <script>
        // Theme management
        (function() {
            // Check for saved theme preference or default to dark
            const currentTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
        })();

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Update icon visibility
            updateThemeIcon(newTheme);
        }

        function updateThemeIcon(theme) {
            document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
                icon.classList.remove('active');
            });
            const iconToShow = document.querySelector('.theme-toggle-icon.' + theme);
            if (iconToShow) {
                iconToShow.classList.add('active');
            }
        }

        // Set initial icon state after DOM loads
        document.addEventListener('DOMContentLoaded', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            updateThemeIcon(currentTheme);
        });
    </script>
</head>
<body>
    <!-- Theme toggle button -->
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
        <img class="theme-toggle-icon dark" src="assets/sun-solid-full.svg" alt="Switch to light mode" />
        <img class="theme-toggle-icon light" src="assets/moon-solid-full.svg" alt="Switch to dark mode" />
    </button>
    <div class="container">
        <div class="page-header">
            <div class="uniswap-logo">
                <img src="assets/uniswap-logo.svg" alt="Uniswap" style="width: 100%; height: 100%; filter: var(--logo-filter);" />
            </div>
            <h1>Uniswap Position Tracker</h1>
        </div>
        <div class="timestamp">Updated on ${formattedDateTime}</div>

        ${dashboardSection}

        ${positionTables}
        
        <div class="footer">
            <p>Powered by The Graph Protocol | Auto-generated by Uniswap Position Tracker | © Yavor Radulov ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  private groupPositionsByIds(allData: PositionData[]): Map<string, PositionData[]> {
    const groups = new Map<string, PositionData[]>();

    for (const position of allData) {
      const id = position.positionId;
      if (!groups.has(id)) {
        groups.set(id, []);
      }
      groups.get(id)!.push(position);
    }

    // Sort each group by date (newest first)
    groups.forEach(positions => {
      positions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return groups;
  }

  private buildDashboardSection(metrics: any): string {
    const pnlClass = metrics.totalPnL > 0 ? "positive" : metrics.totalPnL < 0 ? "negative" : "neutral";
    const pnlSign = metrics.totalPnL >= 0 ? "+" : "-";

    const fees24hClass = metrics.fees24h > 0 ? "positive" : metrics.fees24h < 0 ? "negative" : "neutral";
    const fees24hSign = metrics.fees24h >= 0 ? "+" : "-";

    const pnlPercentage = formatPercentageWithClass(metrics.totalPnLChange);
    const feesPercentage = formatPercentageWithClass(metrics.totalFeesChange);
    const ethPercentage = formatPercentageWithClass(metrics.ethPriceChange);
    const valuePercentage = formatPercentageWithClass(metrics.totalValueChange);

    // Dynamic P&L emoji based on positive/negative
    const pnlIcon =
      metrics.totalPnL > 0
        ? '<img src="assets/arrow-trend-up-solid-full.svg" alt="Profit" />'
        : metrics.totalPnL < 0
        ? '<img src="assets/arrow-trend-down-solid-full.svg" alt="Loss" />'
        : '<img src="assets/building-columns-solid-full.svg" alt="Neutral" />';

    return `
        <div class="dashboard-glass">
            <div class="glass-card">
                <div class="glass-icon">${pnlIcon}</div>
                <div class="metric-label">Total P&L</div>
                <div class="metric-value ${pnlClass}">${pnlSign}$${Math.abs(metrics.totalPnL).toFixed(2)}</div>
                <div class="metric-percentage ${pnlPercentage.class}">${pnlPercentage.text}</div>
            </div>
            <div class="glass-card">
                <div class="glass-icon"><img src="assets/sack-dollar-solid-full.svg" alt="Total Fees" /></div>
                <div class="metric-label">Total Fees</div>
                <div class="metric-value">$${metrics.totalFees.toFixed(2)}</div>
                <div class="metric-percentage ${feesPercentage.class}">${feesPercentage.text}</div>
            </div>
            <div class="glass-card">
                <div class="glass-icon"><img src="assets/bolt-solid-full.svg" alt="24h Fees" /></div>
                <div class="metric-label">24h Fees</div>
                <div class="metric-value ${fees24hClass}">${fees24hSign}$${Math.abs(metrics.fees24h).toFixed(2)}</div>
            </div>
            <div class="glass-card">
                <div class="glass-icon"><img src="assets/ethereum.svg" alt="Ethereum" /></div>
                <div class="metric-label">ETH Price</div>
                <div class="metric-value">$${metrics.currentEthPrice.toFixed(2)}</div>
                <div class="metric-percentage ${ethPercentage.class}">${ethPercentage.text}</div>
            </div>
            <div class="glass-card">
                <div class="glass-icon"><img src="assets/building-columns-solid-full.svg" alt="Total Value" /></div>
                <div class="metric-label">Total Value</div>
                <div class="metric-value">$${metrics.totalValue.toFixed(2)}</div>
                <div class="metric-percentage ${valuePercentage.class}">${valuePercentage.text}</div>
            </div>
        </div>`;
  }

  private buildPositionHistoryTable(
    positionId: string,
    positions: PositionData[],
    portfolioMetrics: PortfolioMetrics,
    livePosition: PositionData | null = null,
    referenceFor24h: PositionData | null = null
  ): string {
    if (positions.length === 0) return "";

    const latestPosition = positions[0];
    if (!latestPosition) return "";

    const poolName = `${latestPosition.token0.symbol} / ${latestPosition.token1.symbol}`;
    const token0Icon = getTokenIcon(latestPosition.token0.symbol);
    const token1Icon = getTokenIcon(latestPosition.token1.symbol);
    const tokenPairSVG = generateTokenPairSVG(token0Icon, token1Icon, positionId);
    const feePercent = (latestPosition.fee / 10000).toString();
    const chainName = latestPosition.chain
      ? latestPosition.chain.toString().charAt(0).toUpperCase() + latestPosition.chain.toString().slice(1)
      : "Unknown";

    const priceRange =
      latestPosition.priceRange && !isNaN(latestPosition.priceRange.lower) && !isNaN(latestPosition.priceRange.upper)
        ? `$${latestPosition.priceRange.lower.toFixed(2)} - $${latestPosition.priceRange.upper.toFixed(2)}`
        : `${latestPosition.tickLower} - ${latestPosition.tickUpper}`;

    // Get metrics for this position from the portfolio metrics
    const positionMetrics = portfolioMetrics.positions.find(p => p.positionId === positionId);

    // Use all metrics from centralized calculator
    const positionAge = positionMetrics?.positionAge || { days: 0, text: "New position" };
    const averageDailyFees = positionMetrics?.averageDailyFees || 0;
    const latestTotalFees = positionMetrics?.currentFees || 0; // Use current fees from metrics
    const profitLoss = {
      value: positionMetrics?.totalPnL || 0,
      percentage: positionMetrics?.totalPnLPercentage || 0
    };
    const profitLossClass = profitLoss.value > 0 ? "positive" : profitLoss.value < 0 ? "negative" : "neutral";
    const profitLossSign = profitLoss.value >= 0 ? "+" : "-";
    const profitLossPercentSign = profitLoss.percentage >= 0 ? "+" : "";

    // Build the LIVE row if we have live position data
    let currentStateRow = "";
    if (livePosition && referenceFor24h) {
      currentStateRow = this.buildCurrentStateRow(livePosition, referenceFor24h);
    } else if (livePosition) {
      // Fallback if no reference is available (shouldn't happen normally)
      currentStateRow = this.buildCurrentStateRow(livePosition, latestPosition);
    }

    const rows = positions
      .map((position, index) => {
        const previousPosition = index < positions.length - 1 ? positions[index + 1] || null : null;
        return this.buildTableRow(position, previousPosition);
      })
      .join("\n");

    const chainClass = chainName.toLowerCase();

    return `
        <div class="position-card">
            <div class="position-header">
                <div>
                    <div class="position-top-row">
                        <div class="token-pair-logo">
                            ${tokenPairSVG}
                        </div>
                        <div class="position-content">
                            <div class="position-title-row">
                                <span class="pair-name">${poolName}</span>
                            </div>
                            <div class="badge-group">
                                <span class="protocol-badge">v3</span>
                                <span class="fee-badge">${feePercent}%</span>
                                <span class="chain-badge ${chainClass}">
                                    <img src="assets/${chainClass}.svg" alt="${chainName}" />
                                    ${chainName}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="position-range">Range: ${priceRange}</div>
                        <div class="position-id">Position #${positionId} • <span class="position-age">${
      positionAge.text
    }</span></div>
                    </div>
                </div>
                <div class="fees-indicators">
                    <div class="profit-loss-indicator ${profitLossClass}">
                        <span class="profit-loss-label ${profitLossClass}">P/L <span class="profit-loss-percent">(${profitLossPercentSign}${profitLoss.percentage.toFixed(
      2
    )}%)</span></span>
                        <span class="profit-loss-value ${profitLossClass}">${profitLossSign}$${Math.abs(
      profitLoss.value
    ).toFixed(2)}</span>
                    </div>
                    <div class="total-fees-indicator">
                        <span class="total-fees-label">Total Fees</span>
                        <span class="total-fees-value">$${latestTotalFees.toFixed(2)}</span>
                    </div>
                    <div class="average-fees-indicator">
                        <span class="average-fees-label">Avg Daily Fees</span>
                        <span class="average-fees-value">$${averageDailyFees.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>24h Fees</th>
                            <th>Total Value (USD)</th>
                            <th>Current Price (USD)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentStateRow}
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>`;
  }

  private buildTableRow(position: PositionData, previousPosition: PositionData | null): string {
    const isInRange = isPositionInRange(position);
    const statusBadge = formatStatusBadge(isInRange);

    // Calculate price percentage difference from previous entry
    const priceDiff = calculatePriceDifference(position.priceRange?.current, previousPosition?.priceRange?.current);
    const currentPriceHtml = formatPriceWithChange(position.priceRange?.current, priceDiff?.percentageChange || null);

    const fullDateStr = formatTableDate(position.timestamp, TIMEZONE.SOFIA);

    // Calculate 24h fee difference
    const feeDiff = calculateFeeDifference(position, previousPosition);
    const feesDifferenceHtml = formatFeeDifference(feeDiff);

    // Calculate total value percentage difference from previous entry
    const valueDiff = calculateTotalValueDifference(position.totalValueUSD, previousPosition?.totalValueUSD);
    const totalValueHtml = formatTotalValueWithChange(position.totalValueUSD, valueDiff?.percentageChange || null);

    return `
        <tr>
            <td>${fullDateStr}</td>
            <td>${feesDifferenceHtml}</td>
            <td>${totalValueHtml}</td>
            <td>${currentPriceHtml}</td>
            <td>${statusBadge}</td>
        </tr>`;
  }

  private buildCurrentStateRow(current: PositionData, lastDaily: PositionData): string {
    const isInRange = isPositionInRange(current);
    const statusBadge = formatStatusBadge(isInRange);

    // Calculate changes from last daily snapshot (24h changes)
    const priceDiff = calculatePriceDifference(current.priceRange?.current, lastDaily.priceRange?.current);
    const currentPriceHtml = formatPriceWithChange(current.priceRange?.current, priceDiff?.percentageChange || null);

    // Use timestamp from the actual position data
    const positionDate = new Date(current.timestamp);
    const timeStr = positionDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE.SOFIA
    });
    const monthStr = positionDate
      .toLocaleDateString("en-US", {
        month: "short",
        timeZone: TIMEZONE.SOFIA
      })
      .toUpperCase();
    const dayStr = positionDate.toLocaleDateString("en-US", {
      day: "numeric",
      timeZone: TIMEZONE.SOFIA
    });

    // Calculate 24h fee earnings: current total fees - last daily total fees
    // This shows how much fees were earned in the last 24 hours
    const currentTotalFees = current.uncollectedFees?.totalUSD ?? 0;
    const lastDailyTotalFees = lastDaily.uncollectedFees?.totalUSD ?? 0;
    const fees24h = currentTotalFees - lastDailyTotalFees;
    const feesDifferenceHtml = formatFeeDifference(fees24h);

    // Calculate total value change from last daily
    const valueDiff = calculateTotalValueDifference(current.totalValueUSD, lastDaily.totalValueUSD);
    const totalValueHtml = formatTotalValueWithChange(current.totalValueUSD, valueDiff?.percentageChange || null);

    return `
        <tr class="current-state-row">
            <td>
                <span class="live-badge">LIVE</span>
                <span class="live-time">${monthStr} ${dayStr}, ${timeStr}</span>
            </td>
            <td>${feesDifferenceHtml}</td>
            <td>${totalValueHtml}</td>
            <td>${currentPriceHtml}</td>
            <td>${statusBadge}</td>
        </tr>`;
  }
}
