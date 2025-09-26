import { getLivePositionData } from '../../src/utils/livePosition';
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

describe('getLivePositionData', () => {
  it('should use hourly data as live when more recent than daily', () => {
    const hourlyData = [
      createMockPosition('1', '2024-01-17T15:00:00Z', 3000),
      createMockPosition('2', '2024-01-17T15:00:00Z', 3000)
    ];

    const positionGroups = new Map<string, PositionData[]>();
    positionGroups.set('1', [
      createMockPosition('1', '2024-01-17T00:30:00Z', 2500),
      createMockPosition('1', '2024-01-16T00:30:00Z', 2000)
    ]);
    positionGroups.set('2', [
      createMockPosition('2', '2024-01-17T00:30:00Z', 2500),
      createMockPosition('2', '2024-01-16T00:30:00Z', 2000)
    ]);

    const result = getLivePositionData(hourlyData, positionGroups);

    expect(result.currentPositions).toEqual(hourlyData);
    expect(result.previousPositionsFor24h.length).toBe(2);
    expect(result.previousPositionsFor24h[0]!.timestamp).toBe('2024-01-17T00:30:00Z');
  });

  it('should use daily data as live when more recent than hourly', () => {
    const hourlyData = [
      createMockPosition('1', '2024-01-16T15:00:00Z', 2200),
      createMockPosition('2', '2024-01-16T15:00:00Z', 2200)
    ];

    const positionGroups = new Map<string, PositionData[]>();
    positionGroups.set('1', [
      createMockPosition('1', '2024-01-17T00:30:00Z', 2500), // More recent than hourly
      createMockPosition('1', '2024-01-16T00:30:00Z', 2000)
    ]);
    positionGroups.set('2', [
      createMockPosition('2', '2024-01-17T00:30:00Z', 2500),
      createMockPosition('2', '2024-01-16T00:30:00Z', 2000)
    ]);

    const result = getLivePositionData(hourlyData, positionGroups);

    expect(result.currentPositions[0]!.timestamp).toBe('2024-01-17T00:30:00Z');
    expect(result.previousPositionsFor24h[0]!.timestamp).toBe('2024-01-16T00:30:00Z');
  });

  it('should handle no hourly data', () => {
    const positionGroups = new Map<string, PositionData[]>();
    positionGroups.set('1', [
      createMockPosition('1', '2024-01-17T00:30:00Z', 2500),
      createMockPosition('1', '2024-01-16T00:30:00Z', 2000)
    ]);

    const result = getLivePositionData(null, positionGroups);

    expect(result.currentPositions.length).toBe(1);
    expect(result.currentPositions[0]!.timestamp).toBe('2024-01-17T00:30:00Z');
  });

  it('should handle empty position groups', () => {
    const hourlyData = [createMockPosition('1', '2024-01-17T15:00:00Z', 3000)];
    const positionGroups = new Map<string, PositionData[]>();

    const result = getLivePositionData(hourlyData, positionGroups);

    expect(result.currentPositions).toEqual(hourlyData);
    expect(result.previousPositionsFor24h).toEqual([]);
  });

  describe('getPositionTableData', () => {
    it('should return correct data when hourly is live', () => {
      const hourlyData = [createMockPosition('1', '2024-01-17T15:00:00Z', 3000)];

      const positionGroups = new Map<string, PositionData[]>();
      const dailyPositions = [
        createMockPosition('1', '2024-01-17T00:30:00Z', 2500),
        createMockPosition('1', '2024-01-16T00:30:00Z', 2000)
      ];
      positionGroups.set('1', dailyPositions);

      const result = getLivePositionData(hourlyData, positionGroups);
      const tableData = result.getPositionTableData('1', dailyPositions);

      expect(tableData.livePosition?.timestamp).toBe('2024-01-17T15:00:00Z');
      expect(tableData.historicalPositions).toEqual(dailyPositions); // All daily positions kept
      expect(tableData.referenceFor24h?.timestamp).toBe('2024-01-17T00:30:00Z');
    });

    it('should return correct data when daily is live', () => {
      const positionGroups = new Map<string, PositionData[]>();
      const dailyPositions = [
        createMockPosition('1', '2024-01-17T00:30:00Z', 2500),
        createMockPosition('1', '2024-01-16T00:30:00Z', 2000),
        createMockPosition('1', '2024-01-15T00:30:00Z', 1500)
      ];
      positionGroups.set('1', dailyPositions);

      const result = getLivePositionData(null, positionGroups);
      const tableData = result.getPositionTableData('1', dailyPositions);

      expect(tableData.livePosition?.timestamp).toBe('2024-01-17T00:30:00Z');
      expect(tableData.historicalPositions.length).toBe(2); // Most recent removed
      expect(tableData.historicalPositions[0]!.timestamp).toBe('2024-01-16T00:30:00Z');
      expect(tableData.referenceFor24h?.timestamp).toBe('2024-01-16T00:30:00Z');
    });

    it('should handle missing position ID', () => {
      const positionGroups = new Map<string, PositionData[]>();
      const dailyPositions = [createMockPosition('1', '2024-01-17T00:30:00Z', 2500)];
      positionGroups.set('1', dailyPositions);

      const result = getLivePositionData(null, positionGroups);
      const tableData = result.getPositionTableData('non-existent', []);

      expect(tableData.livePosition).toBeNull();
      expect(tableData.historicalPositions).toEqual([]);
      expect(tableData.referenceFor24h).toBeNull();
    });

    it('should handle position with no previous data for 24h reference', () => {
      const hourlyData = [createMockPosition('1', '2024-01-17T15:00:00Z', 3000)];

      const positionGroups = new Map<string, PositionData[]>();
      const dailyPositions = [createMockPosition('2', '2024-01-17T00:30:00Z', 2500)]; // Different position ID
      positionGroups.set('2', dailyPositions);

      const result = getLivePositionData(hourlyData, positionGroups);
      const tableData = result.getPositionTableData('1', []);

      expect(tableData.livePosition?.timestamp).toBe('2024-01-17T15:00:00Z');
      expect(tableData.referenceFor24h).toBeNull();
    });
  });
});