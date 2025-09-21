export interface WalletConfig {
  address?: string;
  positionId?: string;
}

export interface ScheduleConfig {
  time: string;
  timezone: string;
}

export interface StorageConfig {
  dataPath: string;
  encoding?: BufferEncoding;
  jsonIndent?: number;
}

export interface GraphApiConfig {
  key?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface ConfigSchema {
  wallet: WalletConfig;
  schedule: ScheduleConfig;
  storage: StorageConfig;
  graphApi: GraphApiConfig;
}

export interface EnvironmentVariables {
  WALLET_ADDRESS?: string;
  POSITION_ID?: string;
  SCHEDULE_TIME?: string;
  DATA_FILE_PATH?: string;
  GRAPH_API_KEY?: string;
  TIMEZONE?: string;
}
