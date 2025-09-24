import { config } from "./config";
import { TelegramNotifier } from "./services/telegramNotifier";
import { PositionData } from "./types";
import { buildPositionMap } from "./utils/positionHistory";
import { PositionMetricsCalculator } from "./services/positionMetricsCalculator";
import { DataFetcher } from "./services/dataFetcher";

export async function notifyTelegram() {
  // Check if running in test mode
  const isTestMode = process.argv.includes('--test');

  console.log("🤖 Telegram Position Notifier" + (isTestMode ? " (TEST MODE)" : ""));
  console.log("================================\n");

  if (isTestMode) {
    console.log("🧪 Running in test mode - will display message without sending\n");
  } else {
    console.log("📨 Sending Telegram notification from latest position data...\n");
  }

  const telegramNotifier = new TelegramNotifier(config.telegramBotToken, config.telegramChatId, isTestMode);

  if (!isTestMode && !telegramNotifier.isEnabled()) {
    console.log("❌ Telegram bot token or chat ID not configured in .env file");
    console.log("Add TELEGRAM_BOT_TOKEN=your-bot-token and TELEGRAM_CHAT_ID=your-chat-id to your .env file");
    process.exit(1);
  }

  // Fetch position data using centralized service
  const dataFetcher = new DataFetcher(config.dataFilePath);
  const positionData = await dataFetcher.fetchPositionData();

  if (positionData.source === "none") {
    console.log("❌ No position data found");
    process.exit(1);
  }

  const { allPositions: allPositionsData, latestPositions: positions, previousPositions, timestamps } = positionData;

  // Debug: Show latest timestamp if available
  if (timestamps.length > 0) {
    const latestTimestamp = timestamps[timestamps.length - 1];
    console.log(`Latest timestamp: ${latestTimestamp}`);
  }
  console.log();

  // Use the centralized metrics calculator
  const metricsCalculator = new PositionMetricsCalculator();
  const portfolioMetrics = metricsCalculator.calculatePortfolioMetrics(allPositionsData, positions, previousPositions);

  // Send position update notification with portfolio metrics
  if (isTestMode) {
    console.log("\n📋 Generating Telegram message...");
    const message = await telegramNotifier.sendPositionUpdate(positions, portfolioMetrics);
    console.log("\n" + "=".repeat(50));
    console.log("TELEGRAM MESSAGE (not sent):");
    console.log("=".repeat(50));
    console.log(message);
    console.log("=".repeat(50));
  } else {
    console.log("\n📤 Sending position update to Telegram...");
    await telegramNotifier.sendPositionUpdate(positions, portfolioMetrics);
    console.log("✅ Position update sent");
  }

  // Check for significant changes if we have previous data
  if (!isTestMode && previousPositions.length > 0) {
    await checkForSignificantChanges(positions, previousPositions, telegramNotifier);
  }

  if (isTestMode) {
    console.log("\n✅ Test completed - message generated but not sent");
  } else {
    console.log("\n✅ Telegram notification sent successfully!");
  }
}

// Check for significant value/fee changes
async function checkForSignificantChanges(
  currentPositions: PositionData[],
  previousPositions: PositionData[],
  notifier: TelegramNotifier
) {
  const SIGNIFICANT_CHANGE_PERCENT = 10; // 10% threshold

  const prevPosMap = buildPositionMap(previousPositions);

  for (const currentPos of currentPositions) {
    const prevPos = prevPosMap.get(currentPos.positionId);
    if (!prevPos) continue;

    // Check for significant value change
    const currentValue = currentPos.totalValueUSD ?? 0;
    const prevValue = prevPos.totalValueUSD ?? 0;

    if (prevValue > 0) {
      const valueChangePercent = ((currentValue - prevValue) / prevValue) * 100;
      if (Math.abs(valueChangePercent) >= SIGNIFICANT_CHANGE_PERCENT) {
        console.log(`\n⚠️ Significant value change detected for position ${currentPos.positionId}`);
        await notifier.sendSignificantChange(currentPos, prevValue, valueChangePercent, "value");
      }
    }

    // Check for significant fee change
    // const currentFees = currentPos.uncollectedFees.totalUSD ?? 0;
    // const prevFees = prevPos.uncollectedFees.totalUSD ?? 0;

    // if (prevFees > 0) {
    //   const feeChangePercent = ((currentFees - prevFees) / prevFees) * 100;
    //   if (Math.abs(feeChangePercent) >= SIGNIFICANT_CHANGE_PERCENT) {
    //     console.log(`\n⚠️ Significant fee change detected for position ${currentPos.positionId}`);
    //     await notifier.sendSignificantChange(currentPos, prevFees, feeChangePercent, "fees");
    //   }
    // }
  }
}

// Run the notifier
notifyTelegram().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
