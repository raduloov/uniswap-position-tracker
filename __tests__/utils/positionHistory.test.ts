import {
  buildPositionMap,
  groupPositionsByTimestamp,
  buildPositionHistoryMap,
  buildPositionGroups,
  getLatestPositions,
  getPreviousPositions,
  getOldestPositions
} from '../../src/utils/positionHistory';
import { PositionData, Chain } from '../../src/types';

// Helper to create mock position
const createMockPosition = (
  id: string,
  timestamp: string,
  value: number = 1000
): PositionData => ({
  chain: Chain.ETHEREUM,
  positionId: id,
  owner: '0xowner',
  token0: {
    symbol: 'USDC',
    address: '0xusdc',
    amount: String(value / 2),
    valueUSD: value / 2
  },
  token1: {
    symbol: 'WETH',
    address: '0xweth',
    amount: String(value / 3500),
    valueUSD: value / 2
  },
  totalValueUSD: value,
  liquidity: '1000000',
  tickLower: -887220,
  tickUpper: 887220,
  fee: 3000,
  uncollectedFees: {
    token0: '1',
    token1: '0.0001',
    token0USD: 1,
    token1USD: 0.35,
    totalUSD: 1.35
  },
  pool: {
    address: '0xpool',
    currentTick: 0,
    sqrtPriceX96: '1000000000000000000000000'
  },
  timestamp: timestamp,
  date: timestamp.split('T')[0] || timestamp
});

describe('buildPositionMap', () => {
  it('should build a map from positions', () => {
    const positions = [
      createMockPosition('1', '2024-01-15T12:00:00Z'),
      createMockPosition('2', '2024-01-15T12:00:00Z'),
      createMockPosition('3', '2024-01-15T12:00:00Z')
    ];
    const map = buildPositionMap(positions);

    expect(map.size).toBe(3);
    expect(map.get('1')).toEqual(positions[0]);
    expect(map.get('2')).toEqual(positions[1]);
    expect(map.get('3')).toEqual(positions[2]);
  });

  it('should handle empty array', () => {
    const map = buildPositionMap([]);
    expect(map.size).toBe(0);
  });

  it('should handle duplicate position IDs (last wins)', () => {
    const positions = [
      createMockPosition('1', '2024-01-15T12:00:00Z', 1000),
      createMockPosition('1', '2024-01-16T12:00:00Z', 2000)
    ];
    const map = buildPositionMap(positions);

    expect(map.size).toBe(1);
    expect(map.get('1')?.totalValueUSD).toBe(2000);
  });
});

describe('groupPositionsByTimestamp', () => {
  it('should group positions by timestamp', () => {
    const positions = [
      createMockPosition('1', '2024-01-15T12:00:00Z'),
      createMockPosition('2', '2024-01-15T12:00:00Z'),
      createMockPosition('3', '2024-01-16T12:00:00Z'),
      createMockPosition('4', '2024-01-16T12:00:00Z')
    ];
    const groups = groupPositionsByTimestamp(positions);

    expect(groups.size).toBe(2);
    expect(groups.get('2024-01-15T12:00:00Z')?.length).toBe(2);
    expect(groups.get('2024-01-16T12:00:00Z')?.length).toBe(2);
  });

  it('should handle empty array', () => {
    const groups = groupPositionsByTimestamp([]);
    expect(groups.size).toBe(0);
  });
});

describe('buildPositionHistoryMap', () => {
  it('should build history map with current positions only', () => {
    const current = [
      createMockPosition('1', '2024-01-17T12:00:00Z'),
      createMockPosition('2', '2024-01-17T12:00:00Z')
    ];
    const map = buildPositionHistoryMap(current);

    expect(map.size).toBe(2);
    expect(map.get('1')?.length).toBe(1);
    expect(map.get('2')?.length).toBe(1);
  });

  it('should build history map with current and previous positions', () => {
    const current = [
      createMockPosition('1', '2024-01-17T12:00:00Z', 3000),
      createMockPosition('2', '2024-01-17T12:00:00Z', 3000)
    ];
    const previous = [
      createMockPosition('1', '2024-01-16T12:00:00Z', 2000),
      createMockPosition('2', '2024-01-16T12:00:00Z', 2000)
    ];
    const map = buildPositionHistoryMap(current, previous);

    expect(map.size).toBe(2);
    const positions = map.get('1');
    expect(positions?.length).toBe(2);
    expect(positions?.[0]?.totalValueUSD).toBe(3000); // Current (newest) first
    expect(positions?.[1]?.totalValueUSD).toBe(2000); // Previous second
  });

  it('should build history map with all three time periods', () => {
    const current = [createMockPosition('1', '2024-01-17T12:00:00Z', 3000)];
    const previous = [createMockPosition('1', '2024-01-16T12:00:00Z', 2000)];
    const oldest = [createMockPosition('1', '2024-01-15T12:00:00Z', 1000)];

    const map = buildPositionHistoryMap(current, previous, oldest);

    expect(map.size).toBe(1);
    const positions = map.get('1');
    expect(positions?.length).toBe(3);
    expect(positions?.[0]?.totalValueUSD).toBe(3000); // Current (newest) first
    expect(positions?.[1]?.totalValueUSD).toBe(2000); // Previous second
    expect(positions?.[2]?.totalValueUSD).toBe(1000); // Oldest last
  });

  it('should avoid duplicate timestamps', () => {
    const current = [createMockPosition('1', '2024-01-17T12:00:00Z')];
    const previous = [createMockPosition('1', '2024-01-17T12:00:00Z')]; // Same timestamp

    const map = buildPositionHistoryMap(current, previous);

    expect(map.get('1')?.length).toBe(1);
  });

  it('should handle new positions appearing', () => {
    const current = [
      createMockPosition('1', '2024-01-17T12:00:00Z'),
      createMockPosition('2', '2024-01-17T12:00:00Z') // New position
    ];
    const previous = [createMockPosition('1', '2024-01-16T12:00:00Z')];

    const map = buildPositionHistoryMap(current, previous);

    expect(map.size).toBe(2);
    expect(map.get('1')?.length).toBe(2);
    expect(map.get('2')?.length).toBe(1); // New position only has current
  });
});

describe('buildPositionGroups', () => {
  it('should build position groups with current only', () => {
    const current = [
      createMockPosition('1', '2024-01-17T12:00:00Z'),
      createMockPosition('2', '2024-01-17T12:00:00Z')
    ];
    const groups = buildPositionGroups(current);

    expect(groups.size).toBe(2);
    expect(groups.get('1')?.length).toBe(1);
  });

  it('should build position groups with baseline', () => {
    const current = [createMockPosition('1', '2024-01-17T12:00:00Z', 2000)];
    const baseline = [createMockPosition('1', '2024-01-15T12:00:00Z', 1000)];

    const groups = buildPositionGroups(current, baseline);

    expect(groups.size).toBe(1);
    const group = groups.get('1');
    expect(group?.length).toBe(2);
    expect(group?.[0]?.totalValueUSD).toBe(2000); // Current (newest) first
    expect(group?.[1]?.totalValueUSD).toBe(1000); // Baseline last
  });

  it('should avoid duplicate timestamps', () => {
    const current = [createMockPosition('1', '2024-01-17T12:00:00Z')];
    const baseline = [createMockPosition('1', '2024-01-17T12:00:00Z')]; // Same timestamp

    const groups = buildPositionGroups(current, baseline);

    expect(groups.get('1')?.length).toBe(1);
  });
});

describe('getLatestPositions', () => {
  it('should get latest positions from timestamp map', () => {
    const map = new Map<string, PositionData[]>();
    const older = [createMockPosition('1', '2024-01-15T12:00:00Z')];
    const latest = [createMockPosition('1', '2024-01-16T12:00:00Z')];

    map.set('2024-01-15T12:00:00Z', older);
    map.set('2024-01-16T12:00:00Z', latest);

    const result = getLatestPositions(map);
    expect(result).toBe(latest);
  });

  it('should handle empty map', () => {
    const map = new Map<string, PositionData[]>();
    const result = getLatestPositions(map);
    expect(result).toEqual([]);
  });
});

describe('getPreviousPositions', () => {
  it('should get previous positions from timestamp map', () => {
    const map = new Map<string, PositionData[]>();
    const oldest = [createMockPosition('1', '2024-01-14T12:00:00Z')];
    const previous = [createMockPosition('1', '2024-01-15T12:00:00Z')];
    const latest = [createMockPosition('1', '2024-01-16T12:00:00Z')];

    map.set('2024-01-14T12:00:00Z', oldest);
    map.set('2024-01-15T12:00:00Z', previous);
    map.set('2024-01-16T12:00:00Z', latest);

    const result = getPreviousPositions(map);
    expect(result).toBe(previous);
  });

  it('should return null when less than 2 timestamps', () => {
    const map = new Map<string, PositionData[]>();
    map.set('2024-01-16T12:00:00Z', [createMockPosition('1', '2024-01-16T12:00:00Z')]);

    const result = getPreviousPositions(map);
    expect(result).toBe(null);
  });

  it('should handle empty map', () => {
    const map = new Map<string, PositionData[]>();
    const result = getPreviousPositions(map);
    expect(result).toBe(null);
  });
});

describe('getOldestPositions', () => {
  it('should get oldest positions from timestamp map', () => {
    const map = new Map<string, PositionData[]>();
    const oldest = [createMockPosition('1', '2024-01-14T12:00:00Z')];
    const newer = [createMockPosition('1', '2024-01-15T12:00:00Z')];
    const latest = [createMockPosition('1', '2024-01-16T12:00:00Z')];

    map.set('2024-01-14T12:00:00Z', oldest);
    map.set('2024-01-15T12:00:00Z', newer);
    map.set('2024-01-16T12:00:00Z', latest);

    const result = getOldestPositions(map);
    expect(result).toBe(oldest);
  });

  it('should handle single timestamp', () => {
    const map = new Map<string, PositionData[]>();
    const positions = [createMockPosition('1', '2024-01-16T12:00:00Z')];
    map.set('2024-01-16T12:00:00Z', positions);

    const result = getOldestPositions(map);
    expect(result).toBe(positions);
  });

  it('should handle empty map', () => {
    const map = new Map<string, PositionData[]>();
    const result = getOldestPositions(map);
    expect(result).toBe(null);
  });
});