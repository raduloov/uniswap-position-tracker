import { PositionData } from "../types";
import * as fs from "fs/promises";
import * as path from "path";
import { SupabaseStorage } from "../storage/supabaseStorage";
import { TIMEZONE } from "../constants";

export class HtmlGenerator {
  private htmlFilePath: string;
  private dataFilePath: string;
  private supabaseStorage: SupabaseStorage;

  constructor(htmlFilePath: string = "./docs/index.html", dataFilePath: string = "./data/positions.json") {
    this.htmlFilePath = htmlFilePath;
    this.dataFilePath = dataFilePath;
    this.supabaseStorage = new SupabaseStorage();
  }

  async generatePositionReport(_positions: PositionData[]): Promise<void> {
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
        const supabaseData = await this.supabaseStorage.loadRecentPositions(30);
        if (supabaseData.length > 0) {
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
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦄</text></svg>">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
        }
        .page-header {
            text-align: center;
            margin-bottom: 10px;
        }
        .unicorn-emoji {
            font-size: 6em;
            display: block;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        h1 {
            color: white;
            text-align: center;
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .timestamp {
            color: rgba(255,255,255,0.9);
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .position-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
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
            border-bottom: 2px solid #f0f0f0;
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
            color: #333;
        }
        .protocol-badge, .fee-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
        }
        .protocol-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .fee-badge {
            background: #e9ecef;
            color: #495057;
        }
        .position-id {
            color: #666;
            font-size: 0.9em;
        }
        .total-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #48bb78;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
            max-width: 100%;
        }
        th {
            background: #f7f8fa;
            color: #4a5568;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
            border-bottom: 2px solid #e2e8f0;
        }
        th:first-child {
            border-top-left-radius: 6px;
        }
        th:last-child {
            border-top-right-radius: 6px;
        }
        th:nth-child(1) { width: 20%; } /* Date */
        th:nth-child(2) { width: 14%; } /* 24h Fees */
        th:nth-child(3) { width: 18%; } /* Total Fees */
        th:nth-child(4) { width: 18%; } /* Total Value */
        th:nth-child(5) { width: 15%; } /* Current Price */
        th:nth-child(6) { width: 15%; } /* Status */
        td {
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
            font-size: 0.85em;
            white-space: nowrap;
        }
        td:nth-child(1) { width: 20%; } /* Date */
        td:nth-child(2) { width: 14%; } /* 24h Fees */
        td:nth-child(3) { width: 18%; } /* Total Fees */
        td:nth-child(4) { width: 18%; } /* Total Value */
        td:nth-child(5) { width: 15%; } /* Current Price */
        td:nth-child(6) { width: 15%; } /* Status */
        tr:last-child td {
            border-bottom: none;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .metric-label {
            color: #666;
            font-weight: 500;
        }
        .metric-value {
            font-weight: 600;
            color: #333;
        }
        .in-range {
            color: #48bb78;
            font-weight: 600;
        }
        .out-range {
            color: #f56565;
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
            background-color: #d4edda;
            color: #155724;
        }
        .status-out-range {
            background-color: #f8d7da;
            color: #721c24;
        }
        .fees-total {
            color: #667eea;
            font-weight: 700;
            font-size: 1.1em;
        }
        .fees-24h {
            color: #48bb78;
            font-weight: 700;
            font-size: 1.1em;
        }
        .price-change-positive {
            color: #48bb78;
            font-weight: 600;
        }
        .price-change-negative {
            color: #f56565;
            font-weight: 600;
        }
        .price-change-neutral {
            color: #718096;
            font-weight: 600;
        }
        .summary-row {
            background: linear-gradient(to right, #f8f9fa, #ffffff);
            font-weight: 600;
        }
        .footer {
            text-align: center;
            color: rgba(255,255,255,0.8);
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
                align-items: flex-start;
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
            <span class="unicorn-emoji">🦄</span>
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

    const priceRange = latestPosition.priceRange
      ? `$${latestPosition.priceRange.lower.toFixed(2)} - $${latestPosition.priceRange.upper.toFixed(2)}`
      : `${latestPosition.tickLower} - ${latestPosition.tickUpper}`;

    // Calculate position age in days
    const oldestPosition = positions[positions.length - 1];
    const oldestDate = oldestPosition ? new Date(oldestPosition.timestamp) : new Date();
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageText = ageInDays === 0 ? "New position" : ageInDays === 1 ? "1 day old" : `${ageInDays} days old`;

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
                    </div>
                    <div class="position-id" style="font-weight: 600; font-size: 1.1em; color: #333;">Range: ${priceRange}</div>
                    <div class="position-id">Position #${positionId} • <span style="color: #667eea; font-weight: 600;">${ageText}</span></div>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>24h Fees</th>
                            <th>Total Fees (USD)</th>
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
    const isInRange =
      position.priceRange &&
      position.priceRange.current >= position.priceRange.lower &&
      position.priceRange.current <= position.priceRange.upper;

    const statusBadge = isInRange
      ? '<span class="status-badge status-in-range">In Range</span>'
      : '<span class="status-badge status-out-range">Out of Range</span>';

    // Calculate price percentage difference from previous entry
    let currentPriceHtml = "";
    if (position.priceRange) {
      const basePrice = `$${position.priceRange.current.toFixed(2)}`;

      if (previousPosition && previousPosition.priceRange) {
        const priceDiff = position.priceRange.current - previousPosition.priceRange.current;
        const percentageChange = (priceDiff / previousPosition.priceRange.current) * 100;

        if (Math.abs(percentageChange) < 0.01) {
          currentPriceHtml = basePrice;
        } else {
          const sign = percentageChange >= 0 ? "+" : "";
          const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
          currentPriceHtml = `${basePrice} <span class="${className}">(${sign}${percentageChange.toFixed(2)}%)</span>`;
        }
      } else {
        currentPriceHtml = basePrice;
      }
    } else {
      currentPriceHtml = "N/A";
    }

    const date = new Date(position.timestamp);
    const dateStr = date
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: TIMEZONE.SOFIA
      })
      .toUpperCase();
    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE.SOFIA
    });
    const fullDateStr = `${dateStr}, ${timeStr}`;

    // Calculate 24h fee difference
    let feesDifferenceHtml = "";
    if (previousPosition && previousPosition.uncollectedFees?.totalUSD && position.uncollectedFees?.totalUSD) {
      const diff = position.uncollectedFees.totalUSD - previousPosition.uncollectedFees.totalUSD;
      const sign = diff >= 0 ? "+" : "";
      feesDifferenceHtml = `<span class="fees-24h">${sign}$${Math.abs(diff).toFixed(2)}</span>`;
    } else {
      feesDifferenceHtml = `<span style="color: #718096;">-</span>`;
    }

    // Calculate total value percentage difference from previous entry
    let totalValueHtml = "";
    const baseTotalValue = `<strong>$${position.totalValueUSD?.toFixed(2) || "0.00"}</strong>`;

    if (
      position.totalValueUSD &&
      previousPosition &&
      previousPosition.totalValueUSD &&
      previousPosition.totalValueUSD > 0
    ) {
      const valueDiff = position.totalValueUSD - previousPosition.totalValueUSD;
      const percentageChange = (valueDiff / previousPosition.totalValueUSD) * 100;

      if (Math.abs(percentageChange) < 0.01) {
        totalValueHtml = baseTotalValue;
      } else {
        const sign = percentageChange >= 0 ? "+" : "";
        const className = percentageChange >= 0 ? "price-change-positive" : "price-change-negative";
        totalValueHtml = `${baseTotalValue} <span class="${className}">(${sign}${percentageChange.toFixed(2)}%)</span>`;
      }
    } else {
      totalValueHtml = baseTotalValue;
    }

    return `
        <tr>
            <td>${fullDateStr}</td>
            <td>${feesDifferenceHtml}</td>
            <td class="fees-total">$${position.uncollectedFees.totalUSD?.toFixed(2) || "0.00"}</td>
            <td>${totalValueHtml}</td>
            <td>${currentPriceHtml}</td>
            <td>${statusBadge}</td>
        </tr>`;
  }
}
