import { config } from "./config";
import { DiscordNotifier } from "./services/discordNotifier";
import { SupabaseStorage } from "./storage/supabaseStorage";
import { DataStorage } from "./storage/dataStorage";
import { PositionData } from "./types";
import { calculateValueChange } from "./utils/position";
import { calculatePortfolioSummary } from "./utils/summary";
import { 
  buildPositionHistoryMap, 
  buildPositionMap, 
  groupPositionsByTimestamp,
  getLatestPositions,
  getPreviousPositions 
} from "./utils/positionHistory";

async function sendDiscordNotification() {
  console.log("📨 Sending Discord notification from latest position data...\n");

  const discordNotifier = new DiscordNotifier(config.discordWebhookUrl);

  if (!discordNotifier.isEnabled()) {
    console.log("❌ Discord webhook URL not configured in .env file");
    console.log("Add DISCORD_WEBHOOK_URL=your-webhook-url to your .env file");
    return;
  }

  try {
    let positions: PositionData[] = [];
    let previousPositions: PositionData[] = [];
    let oldestPositions: PositionData[] = [];

    // Try to load from Supabase first
    const supabaseStorage = new SupabaseStorage();
    if (supabaseStorage.isEnabled()) {
      console.log("Loading positions from Supabase...");
      const snapshots = await supabaseStorage.loadAllPositions();

      if (snapshots && snapshots.length > 0) {
        // Snapshots are already arrays of positions grouped by timestamp
        // Get the latest snapshot (last array)
        const latestSnapshot = snapshots[snapshots.length - 1];
        if (Array.isArray(latestSnapshot)) {
          positions = latestSnapshot;
        }

        // Get previous snapshot for comparison (if exists)
        if (snapshots.length > 1) {
          const previousSnapshot = snapshots[snapshots.length - 2];
          if (Array.isArray(previousSnapshot)) {
            previousPositions = previousSnapshot;
          }
        }

        // Get oldest snapshot for P/L calculation
        const oldestSnapshot = snapshots[0];
        if (Array.isArray(oldestSnapshot)) {
          oldestPositions = oldestSnapshot;
        }

        console.log(`Loaded ${positions.length} current positions from Supabase`);
        if (previousPositions.length > 0) {
          console.log(`Loaded ${previousPositions.length} previous positions for comparison`);
        }
        if (oldestPositions.length > 0 && oldestPositions !== positions) {
          console.log(`Loaded ${oldestPositions.length} oldest positions for P/L calculation`);
        }
      }
    }

    // Fallback to local file if no Supabase data
    if (positions.length === 0) {
      console.log("Loading positions from local file...");
      const storage = new DataStorage(config.dataFilePath);
      const localData = await storage.loadData();

      if (localData && localData.length > 0) {
        // Group by timestamp to find latest
        const byTimestamp = groupPositionsByTimestamp(localData);

        // Get latest positions
        positions = getLatestPositions(byTimestamp);

        // Get previous positions if available
        previousPositions = getPreviousPositions(byTimestamp) || [];

        console.log(`Loaded ${positions.length} positions from local file`);
      }
    }

    if (positions.length === 0) {
      console.log("No position data found to send notification");
      return;
    }

    // Calculate summary including P/L
    const summary = calculatePortfolioSummary(
      positions, 
      oldestPositions.length > 0 ? oldestPositions : previousPositions
    );

    // Build position history map for P/L calculations
    const positionHistoryMap = buildPositionHistoryMap(
      positions,
      previousPositions,
      oldestPositions
    );

    // Send position update notification with history
    console.log("\n📤 Sending position update to Discord...");
    await discordNotifier.sendPositionUpdate(positions, summary, previousPositions, positionHistoryMap);
    console.log("✅ Position update sent");

    // Check for significant changes if we have previous data
    if (previousPositions.length > 0) {
      await checkForSignificantChanges(positions, previousPositions, discordNotifier);
    }

    console.log("\n✅ Discord notifications sent successfully!");
  } catch (error) {
    console.error("❌ Error sending Discord notification:", error);
    process.exit(1);
  }
}


async function checkForSignificantChanges(
  currentPositions: PositionData[],
  previousPositions: PositionData[],
  notifier: DiscordNotifier
) {
  const SIGNIFICANT_CHANGE_PERCENT = 10; // 10% threshold

  // Create map of previous positions for easy lookup
  const prevPosMap = buildPositionMap(previousPositions);

  console.log("\nChecking for significant changes...");

  for (const currentPos of currentPositions) {
    const prevPos = prevPosMap.get(currentPos.positionId);
    if (!prevPos) continue;

    // Check value change
    const prevValue = prevPos.totalValueUSD ?? 0;
    const currentValue = currentPos.totalValueUSD ?? 0;

    const valueChange = calculateValueChange(currentValue, prevValue);
    if (valueChange && Math.abs(valueChange.percentage) >= SIGNIFICANT_CHANGE_PERCENT) {
      console.log(
        `  Position ${currentPos.positionId}: ${valueChange.percentage > 0 ? "+" : ""}${valueChange.percentage.toFixed(
          2
        )}% value change`
      );

      await notifier.sendSignificantChange(currentPos, prevValue, valueChange.percentage, "value");

      // Wait a bit between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check fee change
    const prevFees = prevPos.uncollectedFees.totalUSD ?? 0;
    const currentFees = currentPos.uncollectedFees.totalUSD ?? 0;

    const feeChange = calculateValueChange(currentFees, prevFees);
    if (feeChange && Math.abs(feeChange.percentage) >= SIGNIFICANT_CHANGE_PERCENT) {
      console.log(
        `  Position ${currentPos.positionId}: ${feeChange.percentage > 0 ? "+" : ""}${feeChange.percentage.toFixed(
          2
        )}% fee change`
      );

      await notifier.sendSignificantChange(currentPos, prevFees, feeChange.percentage, "fees");

      // Wait a bit between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Run the notification
sendDiscordNotification().catch(console.error);
