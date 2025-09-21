import { PositionData } from "../types";
import * as fs from "fs/promises";
import * as path from "path";
import { SupabaseStorage } from "../storage/supabaseStorage";
import { TIMEZONE } from "../constants";
import { COLORS } from "../constants/colors";
import {
  calculateFeeDifference,
  calculateTotalValueDifference,
  calculatePriceDifference,
  formatFeeDifference,
  formatTotalValueWithChange,
  formatPriceWithChange,
  isPositionInRange,
  formatStatusBadge,
  calculatePositionAge,
  formatTableDate,
  calculateAverageDailyFees,
  calculateProfitLoss
} from "../utils/htmlGenerator";

export class HtmlGenerator {
  private htmlFilePath: string;
  private dataFilePath: string;
  private supabaseStorage: SupabaseStorage;

  constructor(htmlFilePath: string, dataFilePath: string) {
    this.htmlFilePath = htmlFilePath;
    this.dataFilePath = dataFilePath;
    this.supabaseStorage = new SupabaseStorage();
  }

  async generatePositionReport(): Promise<void> {
    // Load all historical data
    const allData = await this.loadAllPositionData();
    const html = this.buildHtml(allData);

    const dir = path.dirname(this.htmlFilePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.htmlFilePath, html, "utf-8");
    console.log(`📄 HTML report generated: ${this.htmlFilePath}`);
  }

  private async loadAllPositionData(): Promise<PositionData[]> {
    try {
      // Try to load from Supabase first
      if (this.supabaseStorage.isEnabled()) {
        const supabaseDataGroups = await this.supabaseStorage.loadAllPositions();
        if (supabaseDataGroups.length > 0) {
          // Flatten the grouped data into a single array
          const supabaseData = supabaseDataGroups.flat();
          console.log(`📊 Loaded ${supabaseData.length} entries from Supabase`);
          return supabaseData;
        }
      }

      // Fall back to local file
      if (
        await fs
          .access(this.dataFilePath)
          .then(() => true)
          .catch(() => false)
      ) {
        const data = await fs.readFile(this.dataFilePath, "utf-8");
        console.log(`📊 Loaded ${JSON.parse(data).length} entries from ${this.dataFilePath}`);
        return JSON.parse(data) as PositionData[];
      }
      return [];
    } catch (error) {
      console.error("Error loading position data:", error);
      return [];
    }
  }

  private buildHtml(allData: PositionData[]): string {
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
    const positionTables = Array.from(positionGroups.entries())
      .map(([positionId, positions]) => this.buildPositionHistoryTable(positionId, positions))
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uniswap Position Tracker - ${currentDate}</title>
    <link rel="icon" href="assets/uniswap-logo.svg">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, ${COLORS.BACKGROUND.PRIMARY_START} 0%, ${
      COLORS.BACKGROUND.PRIMARY_END
    } 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .page-header {
            text-align: center;
            margin-bottom: 10px;
        }
        .uniswap-logo {
            height: 150px;
            margin: 20px auto;
            display: block;
            filter: drop-shadow(${COLORS.SHADOW.TEXT});
        }
        .uniswap-logo img {
            width: 100%;
            height: 100%;
        }
        h1 {
            color: ${COLORS.TEXT.WHITE};
            text-align: center;
            margin: 0;
            font-size: 2.5em;
            text-shadow: ${COLORS.SHADOW.TEXT};
        }
        .timestamp {
            color: ${COLORS.TEXT.LIGHT};
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .position-card {
            background: ${COLORS.BACKGROUND_SOLID.WHITE};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: ${COLORS.SHADOW.CARD};
        }
        .table-container {
            overflow-x: auto;
            margin: 0 -20px;
            padding: 0 20px;
        }
        .position-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid ${COLORS.BORDER.LIGHT};
        }
        .position-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .pair-name {
            font-size: 1.5em;
            font-weight: 600;
            color: ${COLORS.TEXT.PRIMARY};
        }
        .protocol-badge, .fee-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75em;
            font-weight: 600;
            background: ${COLORS.BADGE.DEFAULT_BG};
            color: ${COLORS.BADGE.DEFAULT_TEXT};
        }
        .position-id {
            color: ${COLORS.TEXT.SECONDARY};
            font-size: 0.9em;
        }
        .fees-indicators {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .average-fees-indicator, .total-fees-indicator, .profit-loss-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px 20px;
            border-radius: 8px;
        }
        .average-fees-indicator {
            border: 2px solid ${COLORS.STATUS.SUCCESS};
            background-color: ${COLORS.INDICATOR_BG.SUCCESS};
        }
        .total-fees-indicator {
            border: 2px solid ${COLORS.STATUS.INFO};
            background-color: ${COLORS.INDICATOR_BG.INFO};
        }
        .profit-loss-indicator.positive {
            border: 2px solid ${COLORS.STATUS.SUCCESS};
            background-color: ${COLORS.INDICATOR_BG.SUCCESS};
        }
        .profit-loss-indicator.negative {
            border: 2px solid ${COLORS.STATUS.ERROR};
            background-color: ${COLORS.INDICATOR_BG.ERROR};
        }
        .profit-loss-indicator.neutral {
            border: 2px solid ${COLORS.STATUS.WARNING};
            background-color: ${COLORS.INDICATOR_BG.WARNING};
        }
        .average-fees-label, .total-fees-label {
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .profit-loss-label {
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .average-fees-label {
            color: ${COLORS.STATUS.SUCCESS};
        }
        .total-fees-label {
            color: ${COLORS.STATUS.INFO};
        }
        .profit-loss-label.positive {
            color: ${COLORS.STATUS.SUCCESS};
        }
        .profit-loss-label.negative {
            color: ${COLORS.STATUS.ERROR};
        }
        .profit-loss-label.neutral {
            color: ${COLORS.STATUS.WARNING};
        }
        .average-fees-value {
            color: ${COLORS.STATUS.SUCCESS};
            font-size: 1.5em;
            font-weight: 700;
        }
        .total-fees-value {
            color: ${COLORS.STATUS.INFO};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.positive {
            color: ${COLORS.STATUS.SUCCESS};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.negative {
            color: ${COLORS.STATUS.ERROR};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-value.neutral {
            color: ${COLORS.STATUS.WARNING};
            font-size: 1.5em;
            font-weight: 700;
        }
        .profit-loss-percent {
            font-weight: 500;
            opacity: 0.85;
        }
        .total-value {
            font-size: 1.8em;
            font-weight: bold;
            color: ${COLORS.STATUS.SUCCESS};
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
            max-width: 100%;
        }
        th {
            background: ${COLORS.BACKGROUND_SOLID.HEADER};
            color: ${COLORS.TEXT.MUTED};
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
            border-bottom: 2px solid ${COLORS.BORDER.DEFAULT};
        }
        th:first-child {
            border-top-left-radius: 6px;
        }
        th:last-child {
            border-top-right-radius: 6px;
        }
        th:nth-child(1) { width: 15%; min-width: 100px; } /* Date */
        th:nth-child(2) { width: 15%; min-width: 80px; } /* 24h Fees */
        th:nth-child(3) { width: 20%; min-width: 100px; } /* Total Value */
        th:nth-child(4) { width: 18%; min-width: 100px; } /* Current Price */
        th:nth-child(5) { width: 12%; min-width: 80px; } /* Status */
        td {
            padding: 8px 6px;
            border-bottom: 1px solid ${COLORS.BORDER.LIGHT};
            color: ${COLORS.TEXT.PRIMARY};
            font-size: 0.85em;
            white-space: nowrap;
        }
        td:nth-child(1) { width: 15%; min-width: 100px; } /* Date */
        td:nth-child(2) { width: 15%; min-width: 80px; } /* 24h Fees */
        td:nth-child(3) { width: 20%; min-width: 100px; } /* Total Value */
        td:nth-child(4) { width: 18%; min-width: 100px; } /* Current Price */
        td:nth-child(5) { width: 12%; min-width: 80px; } /* Status */
        tr:last-child td {
            border-bottom: none;
        }
        tr:hover {
            background-color: ${COLORS.BACKGROUND_SOLID.HOVER};
        }
        .metric-label {
            color: ${COLORS.TEXT.SECONDARY};
            font-weight: 500;
        }
        .metric-value {
            font-weight: 600;
            color: ${COLORS.TEXT.PRIMARY};
        }
        .in-range {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 600;
        }
        .out-range {
            color: ${COLORS.STATUS.ERROR};
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-in-range {
            background-color: ${COLORS.BADGE.IN_RANGE_BG};
            color: ${COLORS.BADGE.IN_RANGE_TEXT};
        }
        .status-out-range {
            background-color: ${COLORS.BADGE.OUT_RANGE_BG};
            color: ${COLORS.BADGE.OUT_RANGE_TEXT};
        }
        .fees-total {
            color: ${COLORS.STATUS.INFO};
            font-weight: 700;
            font-size: 1.1em;
        }
        .fees-24h {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 700;
            font-size: 1.1em;
        }
        .price-change-positive {
            color: ${COLORS.STATUS.SUCCESS};
            font-weight: 600;
        }
        .price-change-negative {
            color: ${COLORS.STATUS.ERROR};
            font-weight: 600;
        }
        .price-change-neutral {
            color: ${COLORS.STATUS.NEUTRAL};
            font-weight: 600;
        }
        .summary-row {
            background: linear-gradient(to right, ${COLORS.BACKGROUND_SOLID.GRADIENT_START}, ${
      COLORS.BACKGROUND_SOLID.GRADIENT_END
    });
            font-weight: 600;
        }
        .footer {
            text-align: center;
            color: ${COLORS.TEXT.LIGHTER};
            margin-top: 40px;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            h1 {
                font-size: 1.8em;
            }
            .position-header {
                flex-direction: column;
                align-items: stretch;
            }
            .fees-indicators {
                margin-top: 12px;
                display: flex;
                gap: 6px;
                flex-wrap: nowrap;
                overflow-x: auto;
                width: 100%;
            }
            .average-fees-indicator, .total-fees-indicator, .profit-loss-indicator {
                padding: 6px 8px;
                flex-direction: column;
                justify-content: center;
                flex: 1;
                min-width: 0;
            }
            .average-fees-label, .total-fees-label, .profit-loss-label {
                margin-bottom: 3px;
                margin-right: 0;
                white-space: nowrap;
            }
            .average-fees-value, .total-fees-value {
                font-size: 1em;
            }
            .profit-loss-value.positive, .profit-loss-value.negative, .profit-loss-value.neutral {
                font-size: 1em;
            }
            .position-title {
                flex-wrap: wrap;
                gap: 6px;
            }
            .pair-name {
                font-size: 1.3em;
            }
            .position-id {
                font-size: 0.85em;
            }
            .total-value {
                margin-top: 10px;
            }
            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="page-header">
            <div class="uniswap-logo">
                <img src="assets/uniswap-logo.svg" alt="Uniswap" style="width: 100%; height: 100%; filter: brightness(0) invert(1);" />
            </div>
            <h1>Uniswap Position Tracker</h1>
        </div>
        <div class="timestamp">Updated on ${formattedDateTime}</div>
        
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

  private buildPositionHistoryTable(positionId: string, positions: PositionData[]): string {
    if (positions.length === 0) return "";

    const latestPosition = positions[0];
    if (!latestPosition) return "";

    const poolName = `${latestPosition.token0.symbol} / ${latestPosition.token1.symbol}`;
    const feePercent = (latestPosition.fee / 10000).toString();
    const chainName = latestPosition.chain
      ? latestPosition.chain.charAt(0).toUpperCase() + latestPosition.chain.slice(1)
      : "Unknown";

    const priceRange =
      latestPosition.priceRange && !isNaN(latestPosition.priceRange.lower) && !isNaN(latestPosition.priceRange.upper)
        ? `$${latestPosition.priceRange.lower.toFixed(2)} - $${latestPosition.priceRange.upper.toFixed(2)}`
        : `${latestPosition.tickLower} - ${latestPosition.tickUpper}`;

    // Calculate position age in days
    const oldestPosition = positions[positions.length - 1];
    const positionAge = oldestPosition
      ? calculatePositionAge(oldestPosition.timestamp)
      : { days: 0, text: "New position" };

    // Calculate average daily fees
    const averageDailyFees = calculateAverageDailyFees(positions);

    // Get latest total fees
    const latestTotalFees = latestPosition.uncollectedFees?.totalUSD || 0;

    // Calculate profit/loss
    const profitLoss = calculateProfitLoss(positions);
    const profitLossClass = profitLoss.value > 0 ? "positive" : profitLoss.value < 0 ? "negative" : "neutral";
    const profitLossSign = profitLoss.value >= 0 ? "+" : "";
    const profitLossPercentSign = profitLoss.percentage >= 0 ? "+" : "";

    const rows = positions
      .map((position, index) => {
        const previousPosition = index < positions.length - 1 ? positions[index + 1] || null : null;
        return this.buildTableRow(position, previousPosition);
      })
      .join("\n");

    return `
        <div class="position-card">
            <div class="position-header">
                <div>
                    <div class="position-title">
                        <span class="pair-name">${poolName}</span>
                        <span class="protocol-badge">v3</span>
                        <span class="fee-badge">${feePercent}%</span>
                        <span class="chain-badge" style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background-color: ${
                          chainName === "Arbitrum" ? "#f0f9ff" : "#f5f5ff"
                        }; color: ${chainName === "Arbitrum" ? "#213147" : "#627EEA"}; border: 1px solid ${
      chainName === "Arbitrum" ? "#213147" : "#627EEA"
    }20;">
                            <img src="assets/${chainName.toLowerCase()}.svg" alt="${chainName}" style="width: 14px; height: 14px;" />
                            ${chainName}
                        </span>
                    </div>
                    <div class="position-id" style="font-weight: 600; font-size: 1.1em; color: ${
                      COLORS.TEXT.PRIMARY
                    };">Range: ${priceRange}</div>
                    <div class="position-id">Position #${positionId} • <span style="color: ${
      COLORS.STATUS.INFO
    }; font-weight: 600;">${positionAge.text}</span></div>
                </div>
                <div class="fees-indicators">
                    <div class="profit-loss-indicator ${profitLossClass}">
                        <span class="profit-loss-label ${profitLossClass}">P/L <span class="profit-loss-percent">(${profitLossPercentSign}${profitLoss.percentage.toFixed(
      1
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
}
