import { config } from "./config";
import { TelegramNotifier } from "./services/telegramNotifier";
import { SupabaseStorage } from "./storage/supabaseStorage";
import { PositionData } from "./types";
import {
  buildPositionMap,
  groupPositionsByTimestamp,
  getLatestPositions,
  getPreviousPositions
} from "./utils/positionHistory";
import { calculateProfitLoss } from "./utils/position";

export async function notifyTelegram() {
  console.log("🤖 Telegram Position Notifier");
  console.log("================================\n");

  console.log("📨 Sending Telegram notification from latest position data...\n");

  const telegramNotifier = new TelegramNotifier(config.telegramBotToken, config.telegramChatId);

  if (!telegramNotifier.isEnabled()) {
    console.log("❌ Telegram bot token or chat ID not configured in .env file");
    console.log("Add TELEGRAM_BOT_TOKEN=your-bot-token and TELEGRAM_CHAT_ID=your-chat-id to your .env file");
    process.exit(1);
  }

  let positions: PositionData[] = [];
  let previousPositions: PositionData[] = [];
  let allPositionsData: PositionData[] = [];

  // Get position history
  console.log("☁️ Loading data from Supabase...");
  const supabaseStorage = new SupabaseStorage();

  // Load all positions from Supabase
  const snapshots = await supabaseStorage.loadAllPositions();

  if (!snapshots || snapshots.length === 0) {
    console.log("❌ No position data found in Supabase");
    process.exit(1);
  }

  console.log(`Loaded ${snapshots.length} snapshot(s) from Supabase`);

  // Flatten all snapshots
  allPositionsData = snapshots.flat();
  console.log(`Total positions across all snapshots: ${allPositionsData.length}`);

  // Group by timestamp
  const byTimestamp = groupPositionsByTimestamp(allPositionsData);
  console.log(`Unique timestamps: ${byTimestamp.size}`);

  // Debug: Show latest timestamp and its positions
  const timestamps = Array.from(byTimestamp.keys()).sort();
  if (timestamps.length > 0) {
    const latestTimestamp = timestamps[timestamps.length - 1];
    const latestPositions = latestTimestamp ? byTimestamp.get(latestTimestamp) || [] : [];
    console.log(`Latest timestamp: ${latestTimestamp}`);
    console.log(
      `Positions at latest timestamp: ${latestPositions.map(p => `${p.positionId} (${p.chain})`).join(", ")}`
    );
  }

  // Get latest positions
  positions = getLatestPositions(byTimestamp);
  console.log(`Found ${positions.length} position(s) in latest entry`);

  // Debug: Show position IDs
  if (positions.length > 0) {
    console.log(`Position IDs: ${positions.map(p => `${p.positionId} (${p.chain})`).join(", ")}`);
  }
  console.log();

  // Get previous positions for comparison
  const prevPositions = getPreviousPositions(byTimestamp);
  if (prevPositions && prevPositions.length > 0) {
    previousPositions = prevPositions;
    console.log(`Found ${previousPositions.length} position(s) from previous entry for comparison\n`);
  }

  // Build position history map for per-position P/L calculations
  // Use ALL historical data (like HTML report does) instead of just 3 snapshots
  const positionHistoryMap: Map<string, PositionData[]> = new Map();

  // Group all positions by position ID
  for (const position of allPositionsData) {
    const history = positionHistoryMap.get(position.positionId) || [];
    history.push(position);
    positionHistoryMap.set(position.positionId, history);
  }

  // Sort each position's history by timestamp (newest first, like HTML report)
  for (const [, history] of positionHistoryMap) {
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Calculate total P/L from all position histories (sum of individual P/Ls)
  let totalProfitLoss = 0;
  let totalInitialValue = 0;

  for (const [, history] of positionHistoryMap) {
    if (history.length > 0) {
      const pnl = calculateProfitLoss(history);
      totalProfitLoss += pnl.value;

      // Get initial value from the oldest entry in this position's history
      const oldestEntry = history[history.length - 1];
      if (oldestEntry && oldestEntry.totalValueUSD !== undefined) {
        totalInitialValue += oldestEntry.totalValueUSD;
      }
    }
  }

  const profitLossPercentage = totalInitialValue > 0 ? (totalProfitLoss / totalInitialValue) * 100 : 0;

  // Create summary with corrected P/L values
  const summary = {
    totalValueUSD: positions.reduce((sum, pos) => sum + (pos.totalValueUSD ?? 0), 0),
    totalFeesUSD: positions.reduce((sum, pos) => sum + (pos.uncollectedFees.totalUSD ?? 0), 0),
    inRangeCount: positions.filter(
      pos =>
        pos.priceRange &&
        pos.priceRange.current >= pos.priceRange.lower &&
        pos.priceRange.current <= pos.priceRange.upper
    ).length,
    outOfRangeCount: 0,
    profitLoss: totalProfitLoss,
    profitLossPercentage: profitLossPercentage
  };
  summary.outOfRangeCount = positions.length - summary.inRangeCount;

  // Send position update notification with history
  console.log("\n📤 Sending position update to Telegram...");
  await telegramNotifier.sendPositionUpdate(positions, summary, previousPositions, positionHistoryMap);
  console.log("✅ Position update sent");

  // Check for significant changes if we have previous data
  if (previousPositions.length > 0) {
    await checkForSignificantChanges(positions, previousPositions, telegramNotifier);
  }

  console.log("\n✅ Telegram notification sent successfully!");
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
