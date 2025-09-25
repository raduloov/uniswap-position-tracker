import * as cron from "node-cron";
import { TIMEZONE } from "../constants";

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private hourlyTask: cron.ScheduledTask | null = null;

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

  scheduleHourly(callback: () => void): void {
    const cronExpression = "0 * * * *"; // Run at the start of every hour

    console.log(`\nScheduling task to run hourly (cron: ${cronExpression})`);

    if (this.hourlyTask) {
      this.hourlyTask.stop();
    }

    this.hourlyTask = cron.schedule(
      cronExpression,
      () => {
        console.log(`Running hourly task at ${new Date().toISOString()}`);
        callback();
      },
      {
        timezone: TIMEZONE.SOFIA
      }
    );

    console.log(`Hourly task scheduled successfully. Will run every hour at :00 (${TIMEZONE.SOFIA} timezone)`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log("Daily scheduler stopped");
    }
    if (this.hourlyTask) {
      this.hourlyTask.stop();
      console.log("Hourly scheduler stopped");
    }
  }
}
