import axios from "axios";
import { Chain, DiscordEmbed, DiscordWebhookPayload, PositionData } from "../types";
import { DiscordEmoji } from "../constants/discordEmojis";
import { COLORS } from "../constants/colors";
import {
  isPositionInRange,
  formatFeeTier,
  calculate24hFees,
  calculatePriceChange,
  calculateProfitLoss
} from "../utils/position";
import { formatCurrency } from "../utils/formatting";
import { buildPositionMap } from "../utils/positionHistory";

export class DiscordNotifier {
  private webhookUrl: string | undefined;
  private enabled: boolean;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl;
    this.enabled = Boolean(webhookUrl);
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
    if (!this.enabled || !this.webhookUrl) return;

    // Calculate 24h fees
    const total24hFees = calculate24hFees(positions, previousPositions);

    // Create map of previous positions for comparison
    const prevPosMap = previousPositions ? buildPositionMap(previousPositions) : new Map<string, PositionData>();

    // Use P/L from summary if available, otherwise use total value
    const totalPnL = summary.profitLoss ?? summary.totalValueUSD;
    const totalPnLPercentage = summary.profitLossPercentage ?? 0;

    // Get current price from first position (assuming single pool tracking)
    let currentPriceField = null;
    if (positions.length > 0 && positions[0]?.priceRange?.current) {
      const price = positions[0].priceRange.current;

      // Calculate price change if we have previous data
      let priceChange = "";
      if (previousPositions && previousPositions.length > 0 && previousPositions[0]?.priceRange?.current) {
        const prevPrice = previousPositions[0].priceRange.current;
        const priceChangeData = calculatePriceChange(price, prevPrice);
        priceChange = ` ${priceChangeData.formatted}`;
      }

      currentPriceField = {
        name: `🏷️ ETH Price`,
        value: `${formatCurrency(price)}${priceChange}`,
        inline: true
      };
    }

    const summaryFields = [
      {
        name: `${totalPnL >= 0 ? "📈" : "📉"} Total P/L`,
        value: `${formatCurrency(totalPnL, { showSign: true })}${
          totalPnLPercentage !== 0 ? ` (${totalPnLPercentage >= 0 ? "+" : ""}${totalPnLPercentage.toFixed(1)}%)` : ""
        }`,
        inline: true
      },
      {
        name: "💵 24h Fees",
        value: formatCurrency(total24hFees, { showSign: true }),
        inline: true
      },
      {
        name: "💰 Total Fees",
        value: formatCurrency(summary.totalFeesUSD),
        inline: true
      }
    ];

    // Add current price field if available
    if (currentPriceField) {
      summaryFields.push(currentPriceField);
    }

    const embed: DiscordEmbed = {
      title: `${DiscordEmoji.UNISWAP} Uniswap Position Update`,
      description: `Daily position tracking completed at ${new Date().toLocaleString("en-US", {
        timeZone: "Europe/Sofia"
      })}`,
      color: totalPnL >= 0 ? COLORS.DISCORD.SUCCESS : COLORS.DISCORD.ERROR,
      fields: summaryFields,
      footer: {
        text: "Uniswap Position Tracker"
      },
      timestamp: new Date().toISOString()
    };

    // Add detailed position information for each position
    const sortedPositions = positions
      .filter(p => p.totalValueUSD !== undefined)
      .sort((a, b) => (b.totalValueUSD ?? 0) - (a.totalValueUSD ?? 0));

    // Add each position as a field (Discord has a limit of 25 fields per embed)
    const positionsToShow = sortedPositions.slice(0, 10); // Show up to 10 positions

    if (positionsToShow.length > 0) {
      // Add "Active positions:" header
      embed.fields?.push({
        name: "Active positions:",
        value: "───────────────────",
        inline: false
      });

      for (const pos of positionsToShow) {
        const inRange = isPositionInRange(pos);
        const rangeStatus = inRange ? "✅ In Range" : "❌ Out of Range";
        const poolName = `${pos.token0.symbol}/${pos.token1.symbol}`;
        const chainEmoji = pos.chain === Chain.ETHEREUM ? DiscordEmoji.ETHEREUM : DiscordEmoji.ARBITRUM;

        // Get previous position for comparison (24h)
        const prevPos = prevPosMap.get(pos.positionId);

        const priceRange = pos.priceRange
          ? `$${pos.priceRange.lower.toFixed(0)} - $${pos.priceRange.upper.toFixed(0)}`
          : `[${pos.tickLower}, ${pos.tickUpper}]`;

        // Calculate 24h fee change
        let feeChange = "";
        if (prevPos) {
          const currentFees = pos.uncollectedFees.totalUSD ?? 0;
          const prevFees = prevPos.uncollectedFees.totalUSD ?? 0;
          const feeDiff = currentFees - prevFees;
          if (feeDiff !== 0) {
            feeChange = ` (24h: ${feeDiff >= 0 ? "+" : ""}$${feeDiff.toFixed(2)})`;
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
            valueChange = ` (${valueDiff >= 0 ? "+" : ""}$${valueDiff.toFixed(2)}, ${
              changePercent >= 0 ? "+" : ""
            }${changePercent.toFixed(1)}%)`;
          }
        }

        // Calculate P/L for this position using the utility function
        let positionPnL = "";

        if (positionHistoryMap) {
          const history = positionHistoryMap.get(pos.positionId);
          if (history && history.length > 0) {
            // Use the calculateProfitLoss utility function
            const pnl = calculateProfitLoss(history);
            const pnlEmoji = pnl.value >= 0 ? "📈" : "📉";
            positionPnL = `${pnlEmoji} ${pnl.value >= 0 ? "+" : ""}$${Math.abs(pnl.value).toFixed(2)} (${
              pnl.percentage >= 0 ? "+" : ""
            }${pnl.percentage.toFixed(1)}%)`;
          } else {
            // If no history, just show current value
            const currentValue = pos.totalValueUSD ?? 0;
            positionPnL = `💰 $${currentValue.toFixed(2)}`;
          }
        } else {
          // Fallback to current value if no history map provided
          const currentValue = pos.totalValueUSD ?? 0;
          positionPnL = `💰 $${currentValue.toFixed(2)}`;
        }

        // Format fee tier (convert from basis points to percentage)
        const feeTierPercent = formatFeeTier(pos.fee);

        // Build position details
        const positionDetails = [
          `**Chain:** ${chainEmoji} ${pos.chain.charAt(0).toUpperCase() + pos.chain.slice(1)}`,
          `**Fee Tier:** ${feeTierPercent}%`,
          `**Status:** ${rangeStatus}`,
          `**P/L:** ${positionPnL}`,
          `**Range:** ${priceRange}`,
          `**Value:** ${totalPnL >= 0 ? "📈" : "📉"} ${formatCurrency(pos.totalValueUSD ?? 0)}${valueChange}`,
          `**Uncollected Fees:** ${formatCurrency(pos.uncollectedFees.totalUSD ?? 0)}${feeChange}`
        ].join("\n");

        embed.fields?.push({
          name: `🪙 ${poolName} (ID: ${pos.positionId})`,
          value: positionDetails,
          inline: false
        });

        // Add separator between positions (but not after the last one)
        const currentIndex = positionsToShow.indexOf(pos);
        if (currentIndex < positionsToShow.length - 1) {
          embed.fields?.push({
            name: "\u200B", // Zero-width space for empty name
            value: "───────────────────",
            inline: false
          });
        }
      }

      if (sortedPositions.length > positionsToShow.length) {
        embed.fields?.push({
          name: "📝 Note",
          value: `Showing ${positionsToShow.length} of ${sortedPositions.length} positions`,
          inline: false
        });
      }
    }

    const payload: DiscordWebhookPayload = {
      embeds: [embed]
    };

    try {
      await this.sendWebhook(payload);
      console.log("✅ Discord notification sent successfully");
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error);
    }
  }

  // TODO: Not tested
  async sendSignificantChange(
    position: PositionData,
    previousValue: number,
    changePercent: number,
    changeType: "value" | "fees"
  ): Promise<void> {
    if (!this.enabled || !this.webhookUrl) return;

    const isPositive = changePercent > 0;
    const emoji = isPositive ? "📈" : "📉";
    const color = isPositive ? COLORS.DISCORD.SUCCESS : COLORS.DISCORD.ERROR;

    const currentValue = changeType === "value" ? position.totalValueUSD ?? 0 : position.uncollectedFees.totalUSD ?? 0;
    const changeAmount = currentValue - previousValue;
    const poolName = `${position.token0.symbol}/${position.token1.symbol}`;

    const embed: DiscordEmbed = {
      title: `${emoji} Significant ${changeType === "value" ? "Value" : "Fee"} Change Alert`,
      description: `Position ${poolName} (${position.chain})`,
      color,
      fields: [
        {
          name: "Previous",
          value: formatCurrency(previousValue),
          inline: true
        },
        {
          name: "Current",
          value: formatCurrency(currentValue),
          inline: true
        },
        {
          name: "Change",
          value: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}% (${formatCurrency(changeAmount, {
            showSign: true
          })})`,
          inline: true
        },
        {
          name: "Position Status",
          value: isPositionInRange(position) ? "✅ In Range" : "❌ Out of Range",
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    };

    const payload: DiscordWebhookPayload = {
      embeds: [embed]
    };

    try {
      await this.sendWebhook(payload);
    } catch (error) {
      console.error("Failed to send significant change alert:", error);
    }
  }

  private async sendWebhook(payload: DiscordWebhookPayload): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error("Discord webhook URL not configured");
    }

    await axios.post(this.webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
