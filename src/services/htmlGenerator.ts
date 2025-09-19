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
    <link rel="icon" href="uniswap-logo.svg">
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
        .uniswap-logo {
            height: 150px;
            margin: 20px auto;
            display: block;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        .uniswap-logo svg {
            width: 100%;
            height: 100%;
        }
        .uniswap-logo .st0,
        .uniswap-logo .st1 {
            fill: white;
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
            <div class="uniswap-logo">
                <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 168.3 193.8" style="enable-background: new 0 0 168.3 193.8" xml:space="preserve">
                    <style type="text/css">.st0{fill:white;}.st1{fill-rule:evenodd;clip-rule:evenodd;fill:white;}</style>
                    <path class="st0" d="M66,44.1c-2.1-0.3-2.2-0.4-1.2-0.5c1.9-0.3,6.3,0.1,9.4,0.8c7.2,1.7,13.7,6.1,20.6,13.8l1.8,2.1l2.6-0.4c11.1-1.8,22.5-0.4,32,4c2.6,1.2,6.7,3.6,7.2,4.2c0.2,0.2,0.5,1.5,0.7,2.8c0.7,4.7,0.4,8.2-1.1,10.9c-0.8,1.5-0.8,1.9-0.3,3.2c0.4,1,1.6,1.7,2.7,1.7c2.4,0,4.9-3.8,6.1-9.1l0.5-2.1l0.9,1c5.1,5.7,9.1,13.6,9.7,19.2l0.2,1.5l-0.9-1.3c-1.5-2.3-2.9-3.8-4.8-5.1c-3.4-2.3-7-3-16.5-3.5c-8.6-0.5-13.5-1.2-18.3-2.8c-8.2-2.7-12.4-6.2-22.1-19.1c-4.3-5.7-7-8.8-9.7-11.4C79.6,48.3,73.7,45.3,66,44.1z"/>
                    <path class="st0" d="M140.5,56.8c0.2-3.8,0.7-6.3,1.8-8.6c0.4-0.9,0.8-1.7,0.9-1.7c0.1,0-0.1,0.7-0.4,1.5c-0.8,2.2-0.9,5.3-0.4,8.8c0.7,4.5,1,5.1,5.8,10c2.2,2.3,4.8,5.2,5.8,6.4l1.7,2.2l-1.7-1.6c-2.1-2-6.9-5.8-8-6.3c-0.7-0.4-0.8-0.4-1.3,0.1c-0.4,0.4-0.5,1-0.5,3.9c-0.1,4.5-0.7,7.3-2.2,10.2c-0.8,1.5-0.9,1.2-0.2-0.5c0.5-1.3,0.6-1.9,0.6-6.2c0-8.7-1-10.8-7.1-14.3c-1.5-0.9-4.1-2.2-5.6-2.9c-1.6-0.7-2.8-1.3-2.7-1.3c0.2-0.2,6.1,1.5,8.4,2.5c3.5,1.4,4.1,1.5,4.5,1.4C140.2,60.1,140.4,59.3,140.5,56.8z"/>
                    <path class="st0" d="M70.1,71.7c-4.2-5.8-6.9-14.8-6.3-21.5l0.2-2.1l1,0.2c1.8,0.3,4.9,1.5,6.4,2.4c4,2.4,5.8,5.7,7.5,13.9c0.5,2.4,1.2,5.2,1.5,6.1c0.5,1.5,2.4,5,4,7.2c1.1,1.6,0.4,2.4-2.1,2.2C78.5,79.7,73.4,76.2,70.1,71.7z"/>
                    <path class="st0" d="M135.4,115.2c-19.8-8-26.8-14.9-26.8-26.6c0-1.7,0.1-3.1,0.1-3.1c0.1,0,0.8,0.6,1.7,1.3c4,3.2,8.5,4.6,21,6.4c7.3,1.1,11.5,1.9,15.3,3.2c12.1,4,19.6,12.2,21.4,23.3c0.5,3.2,0.2,9.3-0.6,12.5c-0.7,2.5-2.7,7.1-3.2,7.2c-0.1,0-0.3-0.5-0.3-1.3c-0.2-4.2-2.3-8.2-5.8-11.3C154,123.2,148.6,120.5,135.4,115.2z"/>
                    <path class="st0" d="M121.4,118.5c-0.2-1.5-0.7-3.4-1-4.2l-0.5-1.5l0.9,1.1c1.3,1.5,2.3,3.3,3.2,5.8c0.7,1.9,0.7,2.5,0.7,5.6c0,3-0.1,3.7-0.7,5.4c-1,2.7-2.2,4.6-4.2,6.7c-3.6,3.7-8.3,5.7-15,6.6c-1.2,0.1-4.6,0.4-7.6,0.6c-7.5,0.4-12.5,1.2-17,2.8c-0.6,0.2-1.2,0.4-1.3,0.3c-0.2-0.2,2.9-2,5.4-3.2c3.5-1.7,7.1-2.6,15-4c3.9-0.6,7.9-1.4,8.9-1.8C118.1,135.6,123,127.9,121.4,118.5z"/>
                    <path class="st0" d="M130.5,134.6c-2.6-5.7-3.2-11.1-1.8-16.2c0.2-0.5,0.4-1,0.6-1c0.2,0,0.8,0.3,1.4,0.7c1.2,0.8,3.7,2.2,10.1,5.7c8.1,4.4,12.7,7.8,15.9,11.7c2.8,3.4,4.5,7.3,5.3,12.1c0.5,2.7,0.2,9.2-0.5,11.9c-2.2,8.5-7.2,15.3-14.5,19.2c-1.1,0.6-2,1-2.1,1c-0.1,0,0.3-1,0.9-2.2c2.4-5.1,2.7-10,0.9-15.5c-1.1-3.4-3.4-7.5-8-14.4C133.2,139.6,131.9,137.5,130.5,134.6z"/>
                    <path class="st0" d="M56,165.2c7.4-6.2,16.5-10.6,24.9-12c3.6-0.6,9.6-0.4,12.9,0.5c5.3,1.4,10.1,4.4,12.6,8.1c2.4,3.6,3.5,6.7,4.6,13.6c0.4,2.7,0.9,5.5,1,6.1c0.8,3.6,2.4,6.4,4.4,7.9c3.1,2.3,8.5,2.4,13.8,0.4c0.9-0.3,1.7-0.6,1.7-0.5c0.2,0.2-2.5,2-4.3,2.9c-2.5,1.3-4.5,1.7-7.2,1.7c-4.8,0-8.9-2.5-12.2-7.5c-0.7-1-2.1-3.9-3.3-6.6c-3.5-8.1-5.3-10.5-9.4-13.2c-3.6-2.3-8.2-2.8-11.7-1.1c-4.6,2.2-5.8,8.1-2.6,11.7c1.3,1.5,3.7,2.7,5.7,3c3.7,0.5,6.9-2.4,6.9-6.1c0-2.4-0.9-3.8-3.3-4.9c-3.2-1.4-6.7,0.2-6.6,3.3c0,1.3,0.6,2.1,1.9,2.7c0.8,0.4,0.8,0.4,0.2,0.3c-2.9-0.6-3.6-4.2-1.3-6.5c2.8-2.8,8.7-1.6,10.7,2.3c0.8,1.6,0.9,4.8,0.2,6.8c-1.7,4.4-6.5,6.7-11.4,5.4c-3.3-0.9-4.7-1.8-8.7-5.9c-7-7.2-9.7-8.6-19.7-10.1l-1.9-0.3L56,165.2z"/>
                    <path class="st1" d="M3.4,4.3c23.3,28.3,59.2,72.3,61,74.7c1.5,2,0.9,3.9-1.6,5.3c-1.4,0.8-4.3,1.6-5.7,1.6c-1.6,0-3.5-0.8-4.8-2.1c-0.9-0.9-4.8-6.6-13.6-20.3c-6.7-10.5-12.4-19.2-12.5-19.3C25.8,44,25.8,44,38,65.8C45.7,79.5,48.2,84.4,48.2,85c0,1.3-0.4,2-2,3.8c-2.7,3-3.9,6.4-4.8,13.5c-1,7.9-3.7,13.5-11.4,23c-4.5,5.6-5.2,6.6-6.3,8.9c-1.4,2.8-1.8,4.4-2,8c-0.2,3.8,0.2,6.2,1.3,9.8c1,3.2,2.1,5.3,4.8,9.4c2.3,3.6,3.7,6.3,3.7,7.3c0,0.8,0.2,0.8,3.8,0c8.6-2,15.7-5.4,19.6-9.6c2.4-2.6,3-4,3-7.6c0-2.3-0.1-2.8-0.7-4.2c-1-2.2-2.9-4-7-6.8c-5.4-3.7-7.7-6.7-8.3-10.7c-0.5-3.4,0.1-5.7,3.1-12c3.1-6.5,3.9-9.2,4.4-15.8c0.3-4.2,0.8-5.9,2-7.2c1.3-1.4,2.4-1.9,5.5-2.3c5.1-0.7,8.4-2,11-4.5c2.3-2.1,3.3-4.2,3.4-7.3l0.1-2.3L70.1,77C65.4,71.6,0.3,0,0,0C-0.1,0,1.5,1.9,3.4,4.3z M34.1,146.5c1.1-1.9,0.5-4.3-1.3-5.5c-1.7-1.1-4.3-0.6-4.3,0.9c0,0.4,0.2,0.8,0.8,1c0.9,0.5,1,1,0.3,2.1c-0.7,1.1-0.7,2.1,0.2,2.8C31.2,148.9,33.1,148.3,34.1,146.5z"/>
                    <path class="st1" d="M74.6,93.9c-2.4,0.7-4.7,3.3-5.4,5.9c-0.4,1.6-0.2,4.5,0.5,5.4c1.1,1.4,2.1,1.8,4.9,1.8c5.5,0,10.2-2.4,10.7-5.3c0.5-2.4-1.6-5.7-4.5-7.2C79.3,93.7,76.2,93.4,74.6,93.9z M81,98.9c0.8-1.2,0.5-2.5-1-3.4c-2.7-1.7-6.8-0.3-6.8,2.3c0,1.3,2.1,2.7,4.1,2.7C78.6,100.5,80.4,99.7,81,98.9z"/>
                </svg>
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
