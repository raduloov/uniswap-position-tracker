import axios from "axios";
import { PositionData } from "../types";
import {
  isPositionInRange,
  formatFeeTier,
  calculate24hFees,
  calculatePriceChange,
  calculateProfitLoss
} from "../utils/position";
import { formatCurrency, formatPercentage } from "../utils/formatting";
import { buildPositionMap } from "../utils/positionHistory";

export class TelegramNotifier {
  private botToken: string | undefined;
  private chatId: string | undefined;
  private enabled: boolean;

  constructor(botToken?: string, chatId?: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = Boolean(botToken && chatId);
  }

  async sendPositionUpdate(
    positions: PositionData[],
    summary: {
      totalValueUSD: number;
      totalFeesUSD: number;
      inRangeCount: number;
      outOfRangeCount: number;
      profitLoss?: number;
      profitLossPercentage?: number;
    },
    previousPositions?: PositionData[],
    positionHistoryMap?: Map<string, PositionData[]>
  ): Promise<void> {
    if (!this.enabled || !this.botToken || !this.chatId) return;

    // Calculate 24h fees
    const total24hFees = calculate24hFees(positions, previousPositions);

    // Create map of previous positions for comparison
    const prevPosMap = previousPositions ? buildPositionMap(previousPositions) : new Map<string, PositionData>();

    // Use P/L from summary (consistent with HTML report)
    const totalPnL = summary.profitLoss ?? 0;
    const totalPnLPercentage = summary.profitLossPercentage ?? 0;

    // Build message text using Telegram's HTML format
    let message = `<b>🦄 Uniswap Position Update</b>\n`;
    message += `<i>Daily tracking completed at ${new Date().toLocaleString("en-US", {
      timeZone: "Europe/Sofia"
    })}</i>\n\n`;

    // Summary section
    message += `<b>📊 Summary</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;

    // Total P/L
    const pnlEmoji = totalPnL >= 0 ? "📈" : "📉";
    message += `${pnlEmoji} <b>Total P/L:</b> ${formatCurrency(totalPnL, { showSign: true })}`;
    if (totalPnLPercentage !== 0) {
      message += ` (${formatPercentage(totalPnLPercentage, { showSign: true })})`;
    }
    message += `\n`;

    // 24h Fees
    message += `💵 <b>24h Fees:</b> ${formatCurrency(total24hFees, { showSign: true })}\n`;

    // Total Fees
    message += `💰 <b>Total Fees:</b> ${formatCurrency(summary.totalFeesUSD)}\n`;

    // Current ETH price if available
    if (positions.length > 0 && positions[0]?.priceRange?.current) {
      const price = positions[0].priceRange.current;
      message += `🏷️ <b>ETH Price:</b> ${formatCurrency(price)}`;

      // Calculate price change if we have previous data
      if (previousPositions && previousPositions.length > 0 && previousPositions[0]?.priceRange?.current) {
        const prevPrice = previousPositions[0].priceRange.current;
        const priceChangeData = calculatePriceChange(price, prevPrice);
        message += ` ${priceChangeData.formatted}`;
      }
      message += `\n`;
    }

    // Active positions section
    const sortedPositions = positions
      .filter(p => p.totalValueUSD !== undefined)
      .sort((a, b) => (b.totalValueUSD ?? 0) - (a.totalValueUSD ?? 0));

    console.log(`Processing ${positions.length} total positions, ${sortedPositions.length} with USD values`);

    // Show up to 10 positions (Telegram has message size limits)
    const positionsToShow = sortedPositions.slice(0, 10);

    if (positionsToShow.length > 0) {
      message += `\n<b>🎯 Active Positions</b>\n`;
      message += `━━━━━━━━━━━━━━━━`;

      for (const pos of positionsToShow) {
        const inRange = isPositionInRange(pos);
        const rangeStatus = inRange ? "✅" : "❌";
        const poolName = `${pos.token0.symbol}/${pos.token1.symbol}`;

        // Get previous position for comparison (24h)
        const prevPos = prevPosMap.get(pos.positionId);

        const priceRange = pos.priceRange
          ? `$${pos.priceRange.lower.toFixed(0)}-$${pos.priceRange.upper.toFixed(0)}`
          : `[${pos.tickLower}, ${pos.tickUpper}]`;

        // Calculate position P/L
        let positionPnL = "";
        if (positionHistoryMap) {
          const history = positionHistoryMap.get(pos.positionId);
          if (history && history.length > 0) {
            const pnl = calculateProfitLoss(history);
            const pnlEmoji = pnl.value >= 0 ? "📈" : "📉";
            positionPnL = `${pnlEmoji} ${pnl.value >= 0 ? "+" : ""}$${Math.abs(pnl.value).toFixed(2)} (${
              pnl.percentage >= 0 ? "+" : ""
            }${formatPercentage(Math.abs(pnl.percentage))})`;
          } else {
            const currentValue = pos.totalValueUSD ?? 0;
            positionPnL = `💰 $${currentValue.toFixed(2)}`;
          }
        } else {
          const currentValue = pos.totalValueUSD ?? 0;
          positionPnL = `💰 $${currentValue.toFixed(2)}`;
        }

        // Calculate 24h fee change
        let feeChange = "";
        if (prevPos) {
          const currentFees = pos.uncollectedFees.totalUSD ?? 0;
          const prevFees = prevPos.uncollectedFees.totalUSD ?? 0;
          const feeDiff = currentFees - prevFees;
          if (feeDiff !== 0) {
            feeChange = ` <i>(24h: ${feeDiff >= 0 ? "+" : ""}$${feeDiff.toFixed(2)})</i>`;
          }
        }

        // Calculate value change (24h)
        let valueChange = "";
        if (prevPos) {
          const currentValue = pos.totalValueUSD ?? 0;
          const prevValue = prevPos.totalValueUSD ?? 0;
          const valueDiff = currentValue - prevValue;
          if (valueDiff !== 0) {
            const changePercent = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
            const changeEmoji = valueDiff >= 0 ? "📈" : "📉";
            valueChange = ` ${changeEmoji} <i>(${formatPercentage(changePercent, { showSign: true })})</i>`;
          }
        }

        // Format fee tier
        const feeTierPercent = formatFeeTier(pos.fee);

        // Build position details
        message += `\n<b>${poolName}</b> ${rangeStatus}\n`;
        message += `├ ${pos.chain.charAt(0).toUpperCase() + pos.chain.slice(1)} • ${feeTierPercent}%\n`;
        message += `├ <b>ID: </b>${pos.positionId}\n`;
        message += `├ <b>P/L: </b>${positionPnL}\n`;
        message += `├ <b>Range: </b>${priceRange}\n`;
        message += `├ <b>Value: </b>${formatCurrency(pos.totalValueUSD ?? 0)}${valueChange}\n`;
        message += `└ <b>Fees: </b>${formatCurrency(pos.uncollectedFees.totalUSD ?? 0)}${feeChange}\n`;
      }

      if (sortedPositions.length > positionsToShow.length) {
        message += `\n<i>📝 Showing ${positionsToShow.length} of ${sortedPositions.length} positions</i>\n`;
      }
    }

    // Add footer with link to full report
    message += `\n━━━━━━━━━━━━━━━━\n`;
    message += `📊 <a href="https://raduloov.github.io/uniswap-position-tracker/">View Full Report</a>`;

    // Send the message
    try {
      await this.sendMessage(message);
      console.log("✅ Telegram notification sent successfully");
    } catch (error) {
      console.error("❌ Failed to send Telegram notification:", error);
    }
  }

  async sendSignificantChange(
    position: PositionData,
    previousValue: number,
    changePercent: number,
    changeType: "value" | "fees"
  ): Promise<void> {
    if (!this.enabled || !this.botToken || !this.chatId) return;

    const isPositive = changePercent > 0;
    const emoji = isPositive ? "📈" : "📉";

    const currentValue = changeType === "value" ? position.totalValueUSD ?? 0 : position.uncollectedFees.totalUSD ?? 0;
    const changeAmount = currentValue - previousValue;
    const poolName = `${position.token0.symbol}/${position.token1.symbol}`;

    let message = `<b>${emoji} Significant ${changeType === "value" ? "Value" : "Fee"} Change Alert</b>\n\n`;
    message += `<b>Position:</b> ${poolName} (${position.chain})\n`;
    message += `<b>Previous:</b> ${formatCurrency(previousValue)}\n`;
    message += `<b>Current:</b> ${formatCurrency(currentValue)}\n`;
    message += `<b>Change:</b> ${formatPercentage(changePercent, { showSign: true })} `;
    message += `(${formatCurrency(changeAmount, { showSign: true })})\n`;
    message += `<b>Status:</b> ${isPositionInRange(position) ? "✅ In Range" : "❌ Out of Range"}\n`;

    try {
      await this.sendMessage(message);
    } catch (error) {
      console.error("Failed to send significant change alert:", error);
    }
  }

  private async sendMessage(text: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      throw new Error("Telegram bot token or chat ID not configured");
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    await axios.post(url, {
      chat_id: this.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
