import { SupabaseStorage } from "../storage/supabaseStorage";
import { DataStorage } from "../storage/dataStorage";
import { PositionData, PositionDataResult, PositionDataSource } from "../types";
import { groupPositionsByTimestamp, getLatestPositions, getPreviousPositions } from "../utils/positionHistory";

export class DataFetcher {
  private supabaseStorage: SupabaseStorage;
  private dataStorage: DataStorage;

  constructor(dataFilePath: string) {
    this.supabaseStorage = new SupabaseStorage();
    this.dataStorage = new DataStorage(dataFilePath);
  }

  async fetchPositionData(): Promise<PositionDataResult> {
    let allPositions: PositionData[] = [];
    let source: PositionDataSource = PositionDataSource.NONE;

    // Try Supabase first
    if (this.supabaseStorage.isEnabled()) {
      console.log("☁️ Loading data from Supabase...");
      const snapshots = await this.supabaseStorage.loadAllPositions();

      if (snapshots && snapshots.length > 0) {
        // Flatten all snapshots
        allPositions = snapshots.flat();
        source = PositionDataSource.SUPABASE;
        console.log(`Loaded ${snapshots.length} snapshot(s) from Supabase`);
        console.log(`Total positions across all snapshots: ${allPositions.length}`);
      }
    }

    // Fall back to local file if Supabase failed or not enabled
    if (allPositions.length === 0) {
      console.log("📂 Loading data from local file...");
      const localData = await this.dataStorage.loadData();

      if (localData && localData.length > 0) {
        allPositions = localData;
        source = PositionDataSource.LOCAL;
        console.log(`Loaded ${localData.length} position(s) from local file`);
      }
    }

    if (allPositions.length === 0) {
      return {
        allPositions: [],
        latestPositions: [],
        previousPositions: [],
        timestamps: [],
        source: PositionDataSource.NONE
      };
    }

    // Group by timestamp and extract latest/previous
    const byTimestamp = groupPositionsByTimestamp(allPositions);
    const timestamps = Array.from(byTimestamp.keys()).sort();

    console.log(`Unique timestamps: ${timestamps.length}`);

    // Get latest positions
    const latestPositions = getLatestPositions(byTimestamp);
    console.log(`Found ${latestPositions.length} position(s) in latest entry`);

    // Debug: Show position IDs
    if (latestPositions.length > 0) {
      console.log(`Position IDs: ${latestPositions.map(p => `${p.positionId} (${p.chain})`).join(", ")}`);
    }

    // Get previous positions for comparison
    const previousPositions = getPreviousPositions(byTimestamp) || [];
    if (previousPositions.length > 0) {
      console.log(`Found ${previousPositions.length} position(s) from previous entry for comparison`);
    }

    return {
      allPositions,
      latestPositions,
      previousPositions,
      timestamps,
      source
    };
  }

  async fetchAllPositionData(): Promise<PositionData[]> {
    // Try Supabase first
    if (this.supabaseStorage.isEnabled()) {
      const snapshots = await this.supabaseStorage.loadAllPositions();
      if (snapshots && snapshots.length > 0) {
        const allData = snapshots.flat();
        console.log(`📊 Loaded ${allData.length} entries from Supabase`);
        return allData;
      }
    }

    // Fall back to local file
    const localData = await this.dataStorage.loadData();
    if (localData && localData.length > 0) {
      console.log(`📊 Loaded ${localData.length} entries from local file`);
      return localData;
    }

    return [];
  }
}
