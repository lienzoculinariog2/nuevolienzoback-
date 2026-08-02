import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  type: 'postgres',
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : process.env.DB_NAME,
  host: isProduction ? undefined : process.env.DB_HOST,
  port: isProduction ? undefined : process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: isProduction ? undefined : process.env.DB_USERNAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,

  synchronize: process.env.TYPEORM_SYNC === 'true', // Temporal: true solo para crear tablas
  dropSchema: process.env.TYPEORM_DROP === 'true', // false siempre en prod
  logging: !isProduction,

  entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: [],

  ssl: isProduction ? { rejectUnauthorized: false } : false,

  extra: { statement_timeout: 60000 },
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
