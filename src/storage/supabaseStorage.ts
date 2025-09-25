import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PositionData, TrackingType } from "../types";

export class SupabaseStorage {
  private supabase: SupabaseClient | null = null;
  private enabled: boolean = false;
  private static hasLoggedStatus: boolean = false;

  constructor() {
    const supabaseUrl = process.env["SUPABASE_URL"];
    const supabaseKey = process.env["SUPABASE_ANON_KEY"];

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.enabled = true;
      if (!SupabaseStorage.hasLoggedStatus) {
        console.log("\n✅ Supabase storage enabled");
        SupabaseStorage.hasLoggedStatus = true;
      }
    } else {
      if (!SupabaseStorage.hasLoggedStatus) {
        console.log("\nℹ️ Supabase not configured, using local file storage");
        SupabaseStorage.hasLoggedStatus = true;
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async savePositions(positions: PositionData[], trackingType: TrackingType): Promise<void> {
    if (!this.enabled || !this.supabase) return;

    try {
      // Save each position as a new row
      for (const position of positions) {
        const { error } = await this.supabase.from("position_snapshots").insert({
          position_id: position.positionId,
          wallet_address: position.owner,
          timestamp: position.timestamp,
          tracking_type: trackingType,
          data: position // Store complete data as JSON
        });

        if (error) {
          console.error("Error saving to Supabase:", error);
        }
      }
      console.log(`💾 Saved ${positions.length} position(s) to Supabase (${trackingType})`);
    } catch (error) {
      console.error("Supabase save error:", error);
    }
  }

  async loadAllPositions(trackingType?: TrackingType): Promise<PositionData[][]> {
    if (!this.enabled || !this.supabase) return [];

    try {
      let query = this.supabase
        .from("position_snapshots")
        .select("data, timestamp, tracking_type")
        .order("timestamp", { ascending: true });

      // Filter by tracking type if specified
      if (trackingType) {
        query = query.eq("tracking_type", trackingType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading from Supabase:", error);
        return [];
      }

      // Group positions by timestamp
      const groupedPositions = new Map<string, PositionData[]>();

      for (const row of data || []) {
        const position = row.data as PositionData;
        const timestamp = position.timestamp;

        if (!groupedPositions.has(timestamp)) {
          groupedPositions.set(timestamp, []);
        }
        groupedPositions.get(timestamp)!.push(position);
      }

      // Convert to array of position arrays
      return Array.from(groupedPositions.values());
    } catch (error) {
      console.error("Supabase load error:", error);
      return [];
    }
  }

  async loadLatestHourlyPosition(): Promise<PositionData[] | null> {
    if (!this.enabled || !this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from("position_snapshots")
        .select("data")
        .eq("tracking_type", TrackingType.HOURLY)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error loading latest hourly from Supabase:", error);
        return null;
      }

      if (data && data.length > 0) {
        const firstRow = data[0];
        if (!firstRow || !firstRow.data) return null;

        // Get all positions for this timestamp
        const latestTimestamp = (firstRow.data as PositionData).timestamp;
        const { data: allData } = await this.supabase
          .from("position_snapshots")
          .select("data")
          .eq("timestamp", latestTimestamp)
          .eq("tracking_type", TrackingType.HOURLY);

        return allData ? allData.map(row => row.data as PositionData) : null;
      }

      return null;
    } catch (error) {
      console.error("Supabase load error:", error);
      return null;
    }
  }
}
