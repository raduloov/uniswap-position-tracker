import * as cron from "node-cron";
import { TIMEZONE } from "../constants";

export class Scheduler {
  private task: cron.ScheduledTask | null = null;

  schedule(time: string, callback: () => void): void {
    const [hours, minutes] = time.split(":");
    const cronExpression = `${minutes} ${hours} * * *`;

    console.log(`\nScheduling task for ${time} daily (cron: ${cronExpression})`);

    if (this.task) {
      this.task.stop();
    }

    this.task = cron.schedule(
      cronExpression,
      () => {
        console.log(`Running scheduled task at ${new Date().toISOString()}`);
        callback();
      },
      {
        timezone: TIMEZONE.SOFIA
      }
    );

    console.log(`Task scheduled successfully. Will run daily at ${time} (${TIMEZONE.SOFIA} timezone)`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log("Scheduler stopped");
    }
  }
}
