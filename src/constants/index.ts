export const DEFAULT_REPORT_PATH = "./docs/index.html";
export const DEFAULT_DATA_PATH = "./data/positions.json";

export const ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";

export const GRAPH_CONSTANTS = {
  ENDPOINTS: {
    ETHEREUM: {
      DECENTRALIZED_TEMPLATE:
        "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
      CHAIN_NAME: "Ethereum"
    },
    ARBITRUM: {
      DECENTRALIZED_TEMPLATE:
        "https://gateway.thegraph.com/api/[api-key]/subgraphs/id/HyW7A86UEdYVt5b9Lrw8W2F98yKecerHKutZTRbSCX27",
      CHAIN_NAME: "Arbitrum"
    },
    API_KEY_PLACEHOLDER: "[api-key]"
  },
  QUERY_LIMITS: {
    MAX_POSITIONS: 100,
    MIN_LIQUIDITY: 0
  }
} as const;

export const UNISWAP_CONSTANTS = {
  MATH: {
    Q32: 32n,
    Q96: 96n,
    Q128: 128n,
    Q256: 256n,
    TWO: 2n,
    TICK_BASE: 1.0001,
    TICK_BASE_PERCENT: 0.01
  },
  FEE: {
    DIVISOR: 10000,
    PERCENT_DIVISOR: 100
  },
  HEX_VALUES: {
    TICK_SPACING: {
      0x1: BigInt("0xfffcb933bd6fad37aa2d162d1a594001"),
      0x2: BigInt("0xfff97272373d413259a46990580e213a"),
      0x4: BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc"),
      0x8: BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0"),
      0x10: BigInt("0xffcb9843d60f6159c9db58835c926644"),
      0x20: BigInt("0xff973b41fa98c081472e6896dfb254c0"),
      0x40: BigInt("0xff2ea16466c96a3843ec78b326b52861"),
      0x80: BigInt("0xfe5dee046a99a2a811c461f1969c3053"),
      0x100: BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4"),
      0x200: BigInt("0xf987a7253ac413176f2b074cf7815e54"),
      0x400: BigInt("0xf3392b0822b70005940c7a398e4b70f3"),
      0x800: BigInt("0xe7159475a2c29b7443b29c7fa6e889d9"),
      0x1000: BigInt("0xd097f3bdfd2022b8845ad8f792aa5825"),
      0x2000: BigInt("0xa9f746462d870fdf8a65dc1f90e061e5"),
      0x4000: BigInt("0x70d869a156d2a1b890bb3df62baf32f7"),
      0x8000: BigInt("0x31be135f97d08fd981231505542fcfa6"),
      0x10000: BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9"),
      0x20000: BigInt("0x5d6af8dedb81196699c329225ee604"),
      0x40000: BigInt("0x2216e584f5fa1ea926041bedfe98"),
      0x80000: BigInt("0x48a170391f7dc42444e8fa2")
    },
    BASE_RATIO: BigInt("0x100000000000000000000000000000000")
  }
} as const;

// Function signature for ticks(int24) - keccak256("ticks(int24)")
export const ARBITRUM_TICKS_FUNCTION_SELECTOR = "0xf30dba93";

export const STABLECOIN_SYMBOLS = ["USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "GUSD"] as const;

export const TIMEZONE = {
  SOFIA: "Europe/Sofia"
} as const;
