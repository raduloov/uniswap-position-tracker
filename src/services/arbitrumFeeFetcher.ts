import axios from "axios";

// Arbitrum RPC endpoint
const ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";

// Function signature for ticks(int24) - keccak256("ticks(int24)")
const TICKS_FUNCTION_SELECTOR = "0xf30dba93";

export class ArbitrumFeeFetcher {
  private retryCount = 3;
  private retryDelay = 1000;

  // Convert number to padded hex (32 bytes)
  private toHex32(num: number): string {
    // Convert to hex and pad to 64 characters (32 bytes)
    const hex = num < 0 
      ? (BigInt(2) ** BigInt(256) + BigInt(num)).toString(16)
      : num.toString(16);
    return hex.padStart(64, "0");
  }

  // Decode uint256 from hex string
  private decodeUint256(hex: string): string {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    // Convert to BigInt and then to string
    return BigInt("0x" + cleanHex).toString();
  }

  async fetchTickData(
    poolAddress: string,
    tickLower: number,
    tickUpper: number
  ): Promise<{
    tickLower: { feeGrowthOutside0X128: string; feeGrowthOutside1X128: string };
    tickUpper: { feeGrowthOutside0X128: string; feeGrowthOutside1X128: string };
  }> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        // Prepare the call data for both ticks
        const lowerTickCallData = TICKS_FUNCTION_SELECTOR + this.toHex32(tickLower);
        const upperTickCallData = TICKS_FUNCTION_SELECTOR + this.toHex32(tickUpper);

        // Make both RPC calls in parallel
        const [lowerResponse, upperResponse] = await Promise.all([
          axios.post(ARBITRUM_RPC_URL, {
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: poolAddress,
                data: lowerTickCallData
              },
              "latest"
            ],
            id: 1
          }),
          axios.post(ARBITRUM_RPC_URL, {
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: poolAddress,
                data: upperTickCallData
              },
              "latest"
            ],
            id: 2
          })
        ]);

        // Parse the responses
        // The response contains 8 values (32 bytes each):
        // 0: liquidityGross (uint128)
        // 1: liquidityNet (int128)
        // 2: feeGrowthOutside0X128 (uint256)
        // 3: feeGrowthOutside1X128 (uint256)
        // 4: tickCumulativeOutside (int56)
        // 5: secondsPerLiquidityOutsideX128 (uint160)
        // 6: secondsOutside (uint32)
        // 7: initialized (bool)
        
        const lowerResult = lowerResponse.data.result;
        const upperResult = upperResponse.data.result;

        if (!lowerResult || !upperResult) {
          throw new Error("Empty response from RPC");
        }

        // Remove 0x prefix and extract fee growth values (positions 2 and 3, each 64 chars)
        const lowerHex = lowerResult.slice(2);
        const upperHex = upperResult.slice(2);

        // Each value is 32 bytes (64 hex chars)
        const lowerFeeGrowth0 = this.decodeUint256(lowerHex.slice(64 * 2, 64 * 3));
        const lowerFeeGrowth1 = this.decodeUint256(lowerHex.slice(64 * 3, 64 * 4));
        const upperFeeGrowth0 = this.decodeUint256(upperHex.slice(64 * 2, 64 * 3));
        const upperFeeGrowth1 = this.decodeUint256(upperHex.slice(64 * 3, 64 * 4));

        return {
          tickLower: {
            feeGrowthOutside0X128: lowerFeeGrowth0,
            feeGrowthOutside1X128: lowerFeeGrowth1
          },
          tickUpper: {
            feeGrowthOutside0X128: upperFeeGrowth0,
            feeGrowthOutside1X128: upperFeeGrowth1
          }
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed to fetch tick data:`, error);
        
        if (attempt < this.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // If all retries failed, return zeros
    console.error(`Failed to fetch tick data after ${this.retryCount} attempts:`, lastError);
    return {
      tickLower: { feeGrowthOutside0X128: "0", feeGrowthOutside1X128: "0" },
      tickUpper: { feeGrowthOutside0X128: "0", feeGrowthOutside1X128: "0" }
    };
  }
}

export default ArbitrumFeeFetcher;