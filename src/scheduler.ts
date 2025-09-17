import cron from 'node-cron';

export class Scheduler {
  private task: cron.ScheduledTask | null = null;

  schedule(time: string, callback: () => void): void {
    const [hours, minutes] = time.split(':');
    const cronExpression = `${minutes} ${hours} * * *`;
    
    console.log(`Scheduling task for ${time} daily (cron: ${cronExpression})`);
    
    if (this.task) {
      this.task.stop();
    }
    
    this.task = cron.schedule(cronExpression, () => {
      console.log(`Running scheduled task at ${new Date().toISOString()}`);
      callback();
    });
    
    console.log(`Task scheduled successfully. Will run daily at ${time}`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('Scheduler stopped');
    }
  }

  runOnce(callback: () => void): void {
    console.log(`Running task once at ${new Date().toISOString()}`);
    callback();
  }
}