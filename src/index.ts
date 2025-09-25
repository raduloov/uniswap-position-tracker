import UniswapPositionTracker from "./client/uniswapPositionTracker";

async function main() {
  try {
    const tracker = new UniswapPositionTracker();

    // Check for flags
    const runOnce = process.argv.includes("--once");
    const reportOnly = process.argv.includes("--report");
    const hourly = process.argv.includes("--hourly");

    if (reportOnly) {
      await tracker.generateReport();
      return;
    }

    await tracker.start(runOnce, hourly);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
