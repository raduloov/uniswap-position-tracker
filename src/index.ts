import { config, validateConfig } from "./config";
import { UniswapClient } from "./uniswapClient";
import { DataStorage } from "./dataStorage";
import { Scheduler } from "./scheduler";
import { HtmlGenerator } from "./htmlGenerator";
import { SupabaseStorage } from "./supabaseStorage";
import { UNISWAP_CONSTANTS, TIMEZONE } from "./constants";

class UniswapPositionTracker {
  private client: UniswapClient;
  private storage: DataStorage;
  private supabaseStorage: SupabaseStorage;
  private scheduler: Scheduler;
  private htmlGenerator: HtmlGenerator;

  constructor() {
    validateConfig();
    this.client = new UniswapClient(config.graphApiKey);
    this.storage = new DataStorage(config.dataFilePath);
    this.supabaseStorage = new SupabaseStorage();
    this.scheduler = new Scheduler();
    this.htmlGenerator = new HtmlGenerator("./docs/index.html", config.dataFilePath);
  }

  async checkPositions(): Promise<void> {
    try {
      console.log("=".repeat(50));
      console.log(`Checking positions at ${new Date().toLocaleString("en-US", { timeZone: TIMEZONE.SOFIA })}`);
      console.log(`Wallet: ${config.walletAddress}`);
      console.log("=".repeat(50));

      const positions = await this.client.getPositions(config.walletAddress, config.positionId);

      if (positions.length === 0) {
        console.log("No active positions found for this wallet");
        return;
      }

      console.log(`Found ${positions.length} active position(s)`);

      for (const position of positions) {
        console.log(`\nPosition #${position.positionId}:`);
        console.log(`  Pool: ${position.token0.symbol}/${position.token1.symbol}`);
        console.log(
          `  Token0: ${position.token0.amount} ${position.token0.symbol} ($${position.token0.valueUSD?.toFixed(2)})`
        );
        console.log(
          `  Token1: ${position.token1.amount} ${position.token1.symbol} ($${position.token1.valueUSD?.toFixed(2)})`
        );
        console.log(`  Total Value: $${position.totalValueUSD?.toFixed(2)}`);
        console.log(`  Fee Tier: ${position.fee / UNISWAP_CONSTANTS.FEE.DIVISOR}%`);

        if (position.priceRange) {
          const isInRange =
            position.priceRange.current >= position.priceRange.lower &&
            position.priceRange.current <= position.priceRange.upper;
          const rangeStatus = isInRange ? "✅ In Range" : "❌ Out of Range";
          console.log(
            `  Price Range (${position.priceRange.currency}): ${position.priceRange.lower.toFixed(
              2
            )} - ${position.priceRange.upper.toFixed(2)}`
          );
          console.log(
            `  Current Price: ${position.priceRange.current.toFixed(2)} ${position.priceRange.currency} ${rangeStatus}`
          );
        } else {
          console.log(`  Price Range: [${position.tickLower}, ${position.tickUpper}]`);
        }

        console.log(`  Uncollected Fees:`);
        console.log(
          `    ${position.token0.symbol}: ${
            position.uncollectedFees.token0
          } ($${position.uncollectedFees.token0USD?.toFixed(2)})`
        );
        console.log(
          `    ${position.token1.symbol}: ${
            position.uncollectedFees.token1
          } ($${position.uncollectedFees.token1USD?.toFixed(2)})`
        );
        console.log(`    Total Fees: $${position.uncollectedFees.totalUSD?.toFixed(2)}`);
      }

      // Save to Supabase if configured, otherwise use local file
      if (this.supabaseStorage.isEnabled()) {
        await this.supabaseStorage.savePositions(positions);
      } else {
        await this.storage.saveData(positions);
        console.log(`\nSaved ${positions.length} position(s) to ${config.dataFilePath}`);
      }

      await this.htmlGenerator.generatePositionReport(positions);

      console.log("\n" + "=".repeat(50));
      console.log("Position check completed");
      console.log("=".repeat(50));
    } catch (error) {
      console.error("Error checking positions:", error);
    }
  }

  async start(runOnce: boolean = false): Promise<void> {
    console.log("🚀 Uniswap Position Tracker Started");
    console.log(`📊 Data will be saved to: ${config.dataFilePath}`);
    
    if (runOnce) {
      console.log("🔄 Running once and exiting...");
      console.log("-".repeat(50));
      await this.checkPositions();
      return;
    }

    console.log(`⏰ Scheduled to run daily at: ${config.scheduleTime}`);
    console.log("-".repeat(50));

    console.log("\nRunning initial check...");
    await this.checkPositions();

    this.scheduler.schedule(config.scheduleTime, () => this.checkPositions());

    console.log("\n✅ Tracker is now running. Press Ctrl+C to stop.");

    process.on("SIGINT", () => {
      console.log("\n\nStopping tracker...");
      this.scheduler.stop();
      process.exit(1);
    });
  }
}

async function main() {
  try {
    const tracker = new UniswapPositionTracker();
    
    // Check for --once flag
    const runOnce = process.argv.includes("--once");
    
    await tracker.start(runOnce);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(0);
  }
}

main().catch(console.error);
