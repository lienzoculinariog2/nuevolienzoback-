import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Solo cargar .env en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

// Configuración para Render (producción) vs desarrollo local
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  type: 'postgres',
  // En producción usar DATABASE_URL, en desarrollo usar variables individuales
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : process.env.DB_NAME,
  host: isProduction ? undefined : process.env.DB_HOST,
  port: isProduction ? undefined : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
  username: isProduction ? undefined : process.env.DB_USERNAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  synchronize: true,
  logging: false,
  dropSchema: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  // Configuración SSL para Render
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
