import { PositionData } from "../types";

export interface PositionTableData {
  livePosition: PositionData | null;
  historicalPositions: PositionData[];
  referenceFor24h: PositionData | null;
}

export interface LivePositionData {
  currentPositions: PositionData[];
  previousPositionsFor24h: PositionData[];
  getPositionTableData: (positionId: string, positions: PositionData[]) => PositionTableData;
}

/**
 * Determines which position data should be shown as "LIVE" and provides a method to get table data for each position
 *
 * @param latestHourlyData - Latest hourly position data (if available)
 * @param positionGroups - Grouped positions by ID
 * @returns Object containing current positions, 24h reference positions, and a method to get table data
 */
export function getLivePositionData(
  latestHourlyData: PositionData[] | null,
  positionGroups: Map<string, PositionData[]>
): LivePositionData {
  // Get the latest daily positions
  const latestDailyPositions = Array.from(positionGroups.values())
    .map(positions => positions[0])
    .filter(pos => pos !== undefined) as PositionData[];

  // Determine which data is most recent - hourly or daily
  let mostRecentData: PositionData[] | null = null;
  let mostRecentIsHourly = false;

  if (latestHourlyData && latestHourlyData.length > 0 && latestDailyPositions.length > 0) {
    // Compare timestamps to determine which is more recent
    const firstHourly = latestHourlyData[0];
    const firstDaily = latestDailyPositions[0];
    if (firstHourly && firstDaily) {
      const latestHourlyTime = new Date(firstHourly.timestamp).getTime();
      const latestDailyTime = new Date(firstDaily.timestamp).getTime();

      if (latestHourlyTime > latestDailyTime) {
        mostRecentData = latestHourlyData;
        mostRecentIsHourly = true;
      } else {
        // Daily data is more recent (e.g., after 00:30 daily run)
        mostRecentData = latestDailyPositions;
        mostRecentIsHourly = false;
      }
    }
  } else if (latestHourlyData && latestHourlyData.length > 0) {
    mostRecentData = latestHourlyData;
    mostRecentIsHourly = true;
  } else {
    mostRecentData = latestDailyPositions;
    mostRecentIsHourly = false;
  }

  // Group the most recent data by position ID
  const mostRecentPositionGroups = new Map<string, PositionData>();
  if (mostRecentData) {
    for (const position of mostRecentData) {
      mostRecentPositionGroups.set(position.positionId, position);
    }
  }

  // For 24h comparison, we need to find the appropriate reference point
  // If most recent is hourly, compare to latest daily
  // If most recent is daily (after 00:30), compare to previous daily
  let previousPositionsFor24h: PositionData[];
  if (mostRecentIsHourly) {
    previousPositionsFor24h = latestDailyPositions;
  } else {
    // Get the second-most-recent daily positions
    const secondLatestDaily = Array.from(positionGroups.values())
      .map(positions => positions[1]) // Get second element (previous daily)
      .filter(pos => pos !== undefined) as PositionData[];
    previousPositionsFor24h = secondLatestDaily.length > 0 ? secondLatestDaily : latestDailyPositions;
  }

  // Function to get position table data for a specific position
  const getPositionTableData = (positionId: string, positions: PositionData[]): PositionTableData => {
    const mostRecentPosition = mostRecentPositionGroups.get(positionId) || null;

    let livePosition: PositionData | null = null;
    let historicalPositions = positions;

    if (mostRecentPosition && !mostRecentIsHourly) {
      // Most recent is daily data (e.g., after 00:30 run)
      // Show it as LIVE and remove it from historical data
      livePosition = mostRecentPosition;
      // Remove the most recent daily from historical positions since we're showing it as LIVE
      historicalPositions = positions.slice(1);
    } else if (mostRecentPosition && mostRecentIsHourly) {
      // Most recent is hourly data, show it as LIVE
      livePosition = mostRecentPosition;
      // Keep all daily positions in historical data
    }

    // Find the appropriate reference position for 24h comparison
    const referenceFor24h = previousPositionsFor24h.find(p => p.positionId === positionId) || null;

    return {
      livePosition,
      historicalPositions,
      referenceFor24h
    };
  };

  return {
    currentPositions: mostRecentData || latestDailyPositions,
    previousPositionsFor24h,
    getPositionTableData
  };
}