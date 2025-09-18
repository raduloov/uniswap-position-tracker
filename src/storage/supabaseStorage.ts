import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PositionData } from "../types";

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

  async savePositions(positions: PositionData[]): Promise<void> {
    if (!this.enabled || !this.supabase) return;

    try {
      // Save each position as a new row
      for (const position of positions) {
        const { error } = await this.supabase.from("position_snapshots").insert({
          position_id: position.positionId,
          wallet_address: position.owner,
          timestamp: position.timestamp,
          data: position // Store complete data as JSON
        });

        if (error) {
          console.error("Error saving to Supabase:", error);
        }
      }
      console.log(`💾 Saved ${positions.length} position(s) to Supabase`);
    } catch (error) {
      console.error("Supabase save error:", error);
    }
  }

  async loadRecentPositions(days: number = 30): Promise<PositionData[]> {
    if (!this.enabled || !this.supabase) return [];

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await this.supabase
        .from("position_snapshots")
        .select("data")
        .gte("timestamp", since.toISOString())
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading from Supabase:", error);
        return [];
      }

      return (data || []).map(row => row.data as PositionData);
    } catch (error) {
      console.error("Supabase load error:", error);
      return [];
    }
  }
}
