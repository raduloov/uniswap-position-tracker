import fs from "fs";
import path from "path";
import { PositionData } from "../types";

export class DataStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
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

  async saveData(positions: PositionData[]): Promise<void> {
    try {
      const existingData = await this.loadData();
      const updatedData = [...existingData, ...positions];

      fs.writeFileSync(this.filePath, JSON.stringify(updatedData, null, 2), "utf-8");

      console.log(`Data saved to ${this.filePath}`);
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  }
}
