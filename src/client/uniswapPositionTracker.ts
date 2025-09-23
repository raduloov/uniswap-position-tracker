import { config, validateConfig } from "../config";
import { DEFAULT_REPORT_PATH, TIMEZONE, UNISWAP_CONSTANTS } from "../constants";
import { HtmlGenerator } from "../services/htmlGenerator";
import { Scheduler } from "../services/scheduler";
import { DataStorage } from "../storage/dataStorage";
import { SupabaseStorage } from "../storage/supabaseStorage";
import { Chain } from "../types";
import UniswapClient from "./uniswapClient";

class UniswapPositionTracker {
  private ethereumClient: UniswapClient;
  private arbitrumClient: UniswapClient;
  private storage: DataStorage;
  private supabaseStorage: SupabaseStorage;
  private scheduler: Scheduler;
  private htmlGenerator: HtmlGenerator;

  constructor() {
    validateConfig();

    this.ethereumClient = new UniswapClient(Chain.ETHEREUM);
    this.arbitrumClient = new UniswapClient(Chain.ARBITRUM);
    this.storage = new DataStorage(config.dataFilePath);
    this.supabaseStorage = new SupabaseStorage();
    this.scheduler = new Scheduler();
    this.htmlGenerator = new HtmlGenerator(DEFAULT_REPORT_PATH, config.dataFilePath);
  }

  async getUniswapPositions(): Promise<void> {
    try {
      console.log("\n" + "=".repeat(50));
      console.log(`Checking positions at ${new Date().toLocaleString("en-US", { timeZone: TIMEZONE.SOFIA })}`);
      console.log(`Wallet: ${config.walletAddress}`);
      console.log("=".repeat(50));

      // Create a shared timestamp for all positions in this batch
      const batchTimestamp = new Date().toISOString();
      
      // Fetch positions from both chains with the same timestamp
      const [ethereumPositions, arbitrumPositions] = await Promise.all([
        this.ethereumClient.getPositions(config.walletAddress, config.positionId, batchTimestamp),
        this.arbitrumClient.getPositions(config.walletAddress, config.positionId, batchTimestamp)
      ]);

      const positions = [...ethereumPositions, ...arbitrumPositions];

      if (positions.length === 0) {
        console.log("No active positions found for this wallet");
        return;
      }

      console.log(`\nFound ${positions.length} active position(s)`);
      console.log(`  - Ethereum: ${ethereumPositions.length} position(s)`);
      console.log(`  - Arbitrum: ${arbitrumPositions.length} position(s)`);

      for (const position of positions) {
        console.log(`\nPosition #${position.positionId} (${position.chain}):`);
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

      console.log(); // Add blank line after last position

      // Save to Supabase if configured, otherwise use local file
      if (this.supabaseStorage.isEnabled()) {
        await this.supabaseStorage.savePositions(positions);
      } else {
        await this.storage.saveData(positions);
        console.log(`\n💾 Saved ${positions.length} position(s) to ${config.dataFilePath}`);
      }
    } catch (error) {
      console.error("Error checking positions:", error);
    }
  }

  async generateReport(): Promise<void> {
    try {
      console.log("\n" + "=".repeat(50));
      console.log("Generating HTML report from existing data...");
      console.log("=".repeat(50) + "\n");

      let hasData = false;

      // Check if Supabase has data
      if (this.supabaseStorage.isEnabled()) {
        console.log("Checking Supabase for position data...");
        const supabaseData = await this.supabaseStorage.loadAllPositions();

        if (supabaseData && supabaseData.length > 0) {
          hasData = true;
          console.log(`Found ${supabaseData.length} snapshots in Supabase`);
        }
      }

      // Check local storage if no Supabase or no data
      if (!hasData) {
        console.log("Checking local file for position data...");
        const localData = await this.storage.loadData();

        if (!localData || localData.length === 0) {
          console.log("No existing position data found");
          return;
        }

        hasData = true;
        console.log(`Found ${localData.length} positions in local file`);
      }

      // Generate HTML report - it will load data internally
      await this.htmlGenerator.generatePositionReport();

      console.log("\n" + "=".repeat(50));
      console.log("HTML report generated successfully");
      console.log("=".repeat(50));
    } catch (error) {
      console.error("Error generating report:", error);
    }
  }

  async start(runOnce: boolean = false): Promise<void> {
    console.log("🚀 Uniswap Position Tracker Started");

    if (!this.supabaseStorage.isEnabled()) {
      console.log(`📊 Data will be saved to: ${config.dataFilePath}`);
    }

    if (runOnce) {
      console.log("🔄 Running once and exiting...");
      await this.getUniswapPositions();
      await this.htmlGenerator.generatePositionReport();
      return;
    }

    console.log(`⏰ Scheduled to run daily at: ${config.scheduleTime}`);

    await this.getUniswapPositions();
    await this.htmlGenerator.generatePositionReport();

    this.scheduler.schedule(config.scheduleTime, () => this.getUniswapPositions());

    console.log("\n✅ Tracker is now running. Press Ctrl+C to stop.");

    process.on("SIGINT", () => {
      console.log("\n\nStopping tracker...");
      this.scheduler.stop();
      process.exit(1);
    });
  }
}

export default UniswapPositionTracker;
