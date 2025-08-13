import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

const config = {
  type: 'postgres',
  // En producción usamos la URL completa, en desarrollo usamos host/username/password/database
  url: isProd ? process.env.DATABASE_URL : undefined,
  host: isProd ? undefined : process.env.DB_HOST,
  port: isProd ? undefined : process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: isProd ? undefined : process.env.DB_USERNAME,
  password: isProd ? undefined : process.env.DB_PASSWORD,
  database: isProd ? undefined : process.env.DB_NAME,
  synchronize: !isProd,             // sincronizar solo en desarrollo
  logging: !isProd,                 // logging solo en desarrollo
  dropSchema: false,
  ssl: isProd ? { rejectUnauthorized: false } : false,  // SSL requerido en Render
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
