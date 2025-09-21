import { PositionData } from "../types";

/**
 * Builds a map of position IDs to their position data for quick lookup
 */
export function buildPositionMap(positions: PositionData[]): Map<string, PositionData> {
  const map = new Map<string, PositionData>();
  for (const pos of positions) {
    map.set(pos.positionId, pos);
  }
  return map;
}

/**
 * Groups positions by timestamp
 */
export function groupPositionsByTimestamp(positions: PositionData[]): Map<string, PositionData[]> {
  const byTimestamp = new Map<string, PositionData[]>();
  for (const pos of positions) {
    const key = pos.timestamp;
    if (!byTimestamp.has(key)) {
      byTimestamp.set(key, []);
    }
    byTimestamp.get(key)?.push(pos);
  }
  return byTimestamp;
}

/**
 * Builds a history map for all positions, organizing them by position ID
 * with newest positions first
 */
export function buildPositionHistoryMap(
  currentPositions: PositionData[],
  previousPositions?: PositionData[],
  oldestPositions?: PositionData[]
): Map<string, PositionData[]> {
  const positionHistoryMap = new Map<string, PositionData[]>();

  // Add oldest positions first (if different from previous)
  if (oldestPositions && oldestPositions.length > 0) {
    for (const pos of oldestPositions) {
      if (!positionHistoryMap.has(pos.positionId)) {
        positionHistoryMap.set(pos.positionId, []);
      }
      positionHistoryMap.get(pos.positionId)?.push(pos);
    }
  }

  // Add previous positions (24h ago) if different from oldest
  if (previousPositions && previousPositions.length > 0 && previousPositions !== oldestPositions) {
    for (const pos of previousPositions) {
      const history = positionHistoryMap.get(pos.positionId);
      if (history && !history.some(p => p.timestamp === pos.timestamp)) {
        history.unshift(pos); // Add newer positions to beginning
      } else if (!history) {
        positionHistoryMap.set(pos.positionId, [pos]);
      }
    }
  }

  // Add current positions (newest)
  for (const pos of currentPositions) {
    const history = positionHistoryMap.get(pos.positionId);
    if (history && !history.some(p => p.timestamp === pos.timestamp)) {
      history.unshift(pos); // Current is newest, add to beginning
    } else if (!history) {
      positionHistoryMap.set(pos.positionId, [pos]);
    }
  }

  return positionHistoryMap;
}

/**
 * Builds position groups for P/L calculation
 * Returns a map where each position ID maps to its history (newest first)
 */
export function buildPositionGroups(
  currentPositions: PositionData[],
  baselinePositions?: PositionData[]
): Map<string, PositionData[]> {
  const positionGroups = new Map<string, PositionData[]>();

  // Add baseline positions (oldest first)
  if (baselinePositions) {
    for (const pos of baselinePositions) {
      if (!positionGroups.has(pos.positionId)) {
        positionGroups.set(pos.positionId, []);
      }
      positionGroups.get(pos.positionId)?.push(pos);
    }
  }

  // Add current positions (newest)
  for (const pos of currentPositions) {
    if (!positionGroups.has(pos.positionId)) {
      positionGroups.set(pos.positionId, []);
    }
    const group = positionGroups.get(pos.positionId);
    // Only add if not already there (avoid duplicates)
    if (group && !group.some(p => p.timestamp === pos.timestamp)) {
      group.unshift(pos); // Add to beginning (newest first)
    }
  }

  return positionGroups;
}

/**
 * Gets the latest positions from a timestamp-grouped map
 */
export function getLatestPositions(timestampMap: Map<string, PositionData[]>): PositionData[] {
  const timestamps = Array.from(timestampMap.keys()).sort();
  if (timestamps.length === 0) return [];
  
  const latestTimestamp = timestamps[timestamps.length - 1];
  return latestTimestamp ? timestampMap.get(latestTimestamp) || [] : [];
}

/**
 * Gets the previous positions from a timestamp-grouped map
 */
export function getPreviousPositions(timestampMap: Map<string, PositionData[]>): PositionData[] | null {
  const timestamps = Array.from(timestampMap.keys()).sort();
  if (timestamps.length < 2) return null;
  
  const previousTimestamp = timestamps[timestamps.length - 2];
  return previousTimestamp ? timestampMap.get(previousTimestamp) || null : null;
}

/**
 * Gets the oldest positions from a timestamp-grouped map
 */
export function getOldestPositions(timestampMap: Map<string, PositionData[]>): PositionData[] | null {
  const timestamps = Array.from(timestampMap.keys()).sort();
  if (timestamps.length === 0) return null;
  
  const oldestTimestamp = timestamps[0];
  return oldestTimestamp ? timestampMap.get(oldestTimestamp) || null : null;
}