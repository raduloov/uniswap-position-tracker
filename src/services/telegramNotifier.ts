import axios from "axios";
import { PortfolioMetrics, PositionData } from "../types";

import { isPositionInRange, formatFeeTier } from "../utils/position";
import { formatCurrency, formatPercentage } from "../utils/formatting";

export class TelegramNotifier {
  private botToken: string | undefined;
  private chatId: string | undefined;
  private enabled: boolean;
  private testMode: boolean;

  constructor(botToken?: string, chatId?: string, testMode: boolean = false) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = Boolean(botToken && chatId);
    this.testMode = testMode;
  }

  async sendPositionUpdate(positions: PositionData[], portfolioMetrics: PortfolioMetrics): Promise<string | void> {
    if (!this.testMode && (!this.enabled || !this.botToken || !this.chatId)) return;

    // Use metrics from the centralized calculator
    const total24hFees = portfolioMetrics.total24hFees;
    const totalPnL = portfolioMetrics.totalPnL;
    const totalPnLPercentage = portfolioMetrics.totalPnLPercentage;

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
    message += `🤑 <b>Total P/L:</b> ${formatCurrency(totalPnL, { showSign: true })}`;
    if (totalPnLPercentage !== 0) {
      message += ` ${pnlEmoji} <i>(${formatPercentage(totalPnLPercentage, { showSign: true })})</i>`;
    }
    message += `\n`;

    // 24h Fees
    message += `💵 <b>24h Fees:</b> ${formatCurrency(total24hFees, { showSign: true })}\n`;

    // Total Fees
    message += `💰 <b>Total Fees:</b> ${formatCurrency(portfolioMetrics.totalFeesUSD)}\n`;

    // Current ETH price if available (use from portfolio metrics)
    const ethPrice = portfolioMetrics.currentEthPrice || positions[0]?.priceRange?.current;
    if (ethPrice) {
      message += `🏷️ <b>ETH Price:</b> ${formatCurrency(ethPrice)}`;

      // Use ETH price change from portfolio metrics
      if (
        portfolioMetrics.ethPrice24hChangePercentage !== null &&
        portfolioMetrics.ethPrice24hChangePercentage !== undefined
      ) {
        const emoji = portfolioMetrics.ethPrice24hChangePercentage >= 0 ? "📈" : "📉";
        message += ` ${emoji} <i>(${formatPercentage(portfolioMetrics.ethPrice24hChangePercentage, {
          showSign: true
        })})</i>`;
      }
      message += `\n`;
    }

    // Total Value with percentage change from initial investment
    message += `💼 <b>Total Value:</b> ${formatCurrency(portfolioMetrics.totalValueUSD)}`;
    if (portfolioMetrics.dashboard.totalValueChange !== 0) {
      const changeEmoji = portfolioMetrics.dashboard.totalValueChange >= 0 ? "📈" : "📉";
      message += ` ${changeEmoji} <i>(${formatPercentage(portfolioMetrics.dashboard.totalValueChange, {
        showSign: true
      })})</i>`;
    }
    message += `\n`;

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

        const priceRange = pos.priceRange
          ? `$${pos.priceRange.lower.toFixed(0)}-$${pos.priceRange.upper.toFixed(0)}`
          : `[${pos.tickLower}, ${pos.tickUpper}]`;

        // Get position metrics from portfolio metrics
        const posMetrics = portfolioMetrics.positions.find(p => p.positionId === pos.positionId);

        // Calculate position P/L (use portfolio metrics)
        let positionPnL = "";
        if (posMetrics && posMetrics.totalPnL !== 0) {
          const pnlEmoji = posMetrics.totalPnL >= 0 ? "📈" : "📉";
          const sign = posMetrics.totalPnL >= 0 ? "+" : "-";
          const percentSign = posMetrics.totalPnLPercentage >= 0 ? "+" : "-";
          positionPnL = `${sign}$${Math.abs(posMetrics.totalPnL).toFixed(
            2
          )} ${pnlEmoji} <i>(${percentSign}${formatPercentage(Math.abs(posMetrics.totalPnLPercentage))})</i>`;
        } else {
          const currentValue = pos.totalValueUSD ?? 0;
          positionPnL = `💰 $${currentValue.toFixed(2)}`;
        }

        // Calculate 24h fee change (use portfolio metrics)
        let feeChange = "";
        if (posMetrics && posMetrics.fees24hChange !== 0) {
          feeChange = ` <i>(24h: ${posMetrics.fees24hChange >= 0 ? "+" : ""}$${posMetrics.fees24hChange.toFixed(
            2
          )})</i>`;
        }

        // Calculate value change (24h) (use portfolio metrics)
        let valueChange = "";
        if (posMetrics && posMetrics.value24hChangePercentage !== 0) {
          const changeEmoji = posMetrics.value24hChange >= 0 ? "📈" : "📉";
          valueChange = ` ${changeEmoji} <i>(${formatPercentage(posMetrics.value24hChangePercentage, {
            showSign: true
          })})</i>`;
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

    // Send the message or return it in test mode
    if (this.testMode) {
      // In test mode, return the formatted message
      return message;
    } else {
      try {
        await this.sendMessage(message);
        console.log("✅ Telegram notification sent successfully");
      } catch (error) {
        console.error("❌ Failed to send Telegram notification:", error);
      }
    }
  }

  async sendSignificantChange(
    position: PositionData,
    previousValue: number,
    changePercent: number,
    changeType: "value" | "fees"
  ): Promise<void> {
    if (!this.testMode && (!this.enabled || !this.botToken || !this.chatId)) return;

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

    if (this.testMode) {
      console.log("\n" + "=".repeat(50));
      console.log("SIGNIFICANT CHANGE ALERT (not sent):");
      console.log("=".repeat(50));
      console.log(message);
      console.log("=".repeat(50));
    } else {
      try {
        await this.sendMessage(message);
      } catch (error) {
        console.error("Failed to send significant change alert:", error);
      }
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
