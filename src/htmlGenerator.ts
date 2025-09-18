import { PositionData } from "./types";
import * as fs from "fs/promises";
import * as path from "path";

export class HtmlGenerator {
  private htmlFilePath: string;
  private dataFilePath: string;

  constructor(htmlFilePath: string = "./data/positions.html", dataFilePath: string = "./data/positions.json") {
    this.htmlFilePath = htmlFilePath;
    this.dataFilePath = dataFilePath;
  }

  async generatePositionReport(_positions: PositionData[]): Promise<void> {
    // Load all historical data
    const allData = await this.loadAllPositionData();
    const html = this.buildHtml(allData);
    
    const dir = path.dirname(this.htmlFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(this.htmlFilePath, html, "utf-8");
    console.log(`\n📄 HTML report generated: ${this.htmlFilePath}`);
  }

  private async loadAllPositionData(): Promise<PositionData[]> {
    try {
      if (await fs.access(this.dataFilePath).then(() => true).catch(() => false)) {
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
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Sofia"
    });

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
    <title>Uniswap Position Report - ${currentDate}</title>
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
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 10px;
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
            overflow-x: auto;
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
            font-size: 1.5em;
            font-weight: 600;
            color: #333;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }
        th:nth-child(1) { width: 13%; } /* Date */
        th:nth-child(2) { width: 15%; } /* Total Value */
        th:nth-child(3) { width: 14%; } /* Total Fees */
        th:nth-child(4) { width: 10%; } /* 24h Fees */
        th:nth-child(5) { width: 20%; } /* Position Range */
        th:nth-child(6) { width: 15%; } /* Current Price */
        th:nth-child(7) { width: 13%; } /* Status */
        td {
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
            font-size: 0.85em;
            white-space: nowrap;
        }
        td:nth-child(1) { width: 13%; } /* Date */
        td:nth-child(2) { width: 15%; } /* Total Value */
        td:nth-child(3) { width: 14%; } /* Total Fees */
        td:nth-child(4) { width: 10%; } /* 24h Fees */
        td:nth-child(5) { width: 20%; } /* Position Range */
        td:nth-child(6) { width: 15%; } /* Current Price */
        td:nth-child(7) { width: 13%; } /* Status */
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
            table {
                font-size: 0.85em;
            }
            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦄 Uniswap V3 Position Report</h1>
        <div class="timestamp">Updated on ${currentDate}</div>
        
        ${positionTables}
        
        <div class="footer">
            <p>Powered by The Graph Protocol | Auto-generated by Uniswap Position Tracker</p>
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
    groups.forEach((positions) => {
      positions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    return groups;
  }

  private buildPositionHistoryTable(positionId: string, positions: PositionData[]): string {
    if (positions.length === 0) return '';
    
    const latestPosition = positions[0];
    if (!latestPosition) return '';
    
    const poolName = `${latestPosition.token0.symbol}/${latestPosition.token1.symbol}`;
    const feePercent = (latestPosition.fee / 10000).toFixed(2);
    
    const rows = positions.map((position, index) => {
      const previousPosition = index < positions.length - 1 ? positions[index + 1] || null : null;
      return this.buildTableRow(position, previousPosition);
    }).join('\n');
    
    return `
        <div class="position-card">
            <div class="position-header">
                <div>
                    <div class="position-title">${poolName} - ${feePercent}% Fee Tier</div>
                    <div class="position-id">Position #${positionId}</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Value (USD)</th>
                        <th>Total Fees (USD)</th>
                        <th>24h Fees</th>
                        <th>Position Range (USD)</th>
                        <th>Current Price (USD)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
  }

  private buildTableRow(position: PositionData, previousPosition: PositionData | null): string {
    const isInRange = position.priceRange && 
      position.priceRange.current >= position.priceRange.lower && 
      position.priceRange.current <= position.priceRange.upper;
    
    const statusBadge = isInRange ? 
      '<span class="status-badge status-in-range">In Range</span>' : 
      '<span class="status-badge status-out-range">Out of Range</span>';
    
    const priceRange = position.priceRange ? 
      `$${position.priceRange.lower.toFixed(2)} - $${position.priceRange.upper.toFixed(2)}` : 
      `${position.tickLower} - ${position.tickUpper}`;
    
    const currentPrice = position.priceRange ? 
      `$${position.priceRange.current.toFixed(2)}` : 
      'N/A';
    
    const date = new Date(position.timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Sofia'
    }).toUpperCase();

    // Calculate 24h fee difference
    let feesDifference = '';
    if (previousPosition && previousPosition.uncollectedFees?.totalUSD && position.uncollectedFees?.totalUSD) {
      const diff = position.uncollectedFees.totalUSD - previousPosition.uncollectedFees.totalUSD;
      const sign = diff >= 0 ? '+' : '';
      const color = diff >= 0 ? '#48bb78' : '#f56565';
      feesDifference = `<span style="color: ${color}; font-weight: 600;">${sign}$${diff.toFixed(2)}</span>`;
    } else {
      feesDifference = '-';
    }

    return `
        <tr>
            <td>${dateStr}</td>
            <td><strong>$${position.totalValueUSD?.toFixed(2) || '0.00'}</strong></td>
            <td class="fees-total">$${position.uncollectedFees.totalUSD?.toFixed(2) || '0.00'}</td>
            <td>${feesDifference}</td>
            <td>${priceRange}</td>
            <td>${currentPrice}</td>
            <td>${statusBadge}</td>
        </tr>`;
  }
}