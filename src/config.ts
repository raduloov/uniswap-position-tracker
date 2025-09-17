import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  walletAddress: process.env.WALLET_ADDRESS || '',
  positionId: process.env.POSITION_ID,
  scheduleTime: process.env.SCHEDULE_TIME || '09:00',
  dataFilePath: process.env.DATA_FILE_PATH || path.join(__dirname, '../data/positions.json'),
  graphApiKey: process.env.GRAPH_API_KEY,
};

export function validateConfig(): void {
  if (!config.walletAddress && !config.positionId) {
    throw new Error('Either WALLET_ADDRESS or POSITION_ID must be provided in .env file');
  }
}