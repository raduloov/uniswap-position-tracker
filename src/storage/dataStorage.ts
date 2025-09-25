import fs from "fs";
import path from "path";
import { PositionData, TrackingType } from "../types";

export class DataStorage {
  private filePath: string;
  private hourlyFilePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    // Create a separate file for hourly data
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, path.extname(filePath));
    this.hourlyFilePath = path.join(dir, `${basename}-hourly.json`);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async loadData(): Promise<PositionData[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(data) as PositionData[];
    } catch (error) {
      console.error("Error loading data:", error);
      return [];
    }
  }

  async saveData(positions: PositionData[], trackingType: TrackingType = TrackingType.DAILY): Promise<void> {
    try {
      if (trackingType === TrackingType.HOURLY) {
        // For hourly data, keep only the latest entry
        fs.writeFileSync(this.hourlyFilePath, JSON.stringify(positions, null, 2), "utf-8");
      } else {
        // For daily data, append to existing
        const existingData = await this.loadData();
        const updatedData = [...existingData, ...positions];
        fs.writeFileSync(this.filePath, JSON.stringify(updatedData, null, 2), "utf-8");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  }

  async loadLatestHourlyData(): Promise<PositionData[] | null> {
    try {
      if (!fs.existsSync(this.hourlyFilePath)) {
        return null;
      }
      const data = fs.readFileSync(this.hourlyFilePath, "utf-8");
      return JSON.parse(data) as PositionData[];
    } catch (error) {
      console.error("Error loading hourly data:", error);
      return null;
    }
  }
}
