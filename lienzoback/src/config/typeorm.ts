import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

// Debug logging
console.log('🔧 TypeORM Config Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('isProd:', isProd);

/** 🔑 Interruptores por ENV (controlas desde Render) */
const allowSync = process.env.TYPEORM_SYNC === 'true';   // <- crea/actualiza tablas
const dropAll   = process.env.TYPEORM_DROP === 'true';   // <- borra y recrea TODO (usar 1 sola vez)

const config = {
  type: 'postgres',
  url: isProd ? process.env.DATABASE_URL : undefined,
  host: isProd ? undefined : process.env.DB_HOST,
  port: isProd ? undefined : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
  username: isProd ? undefined : process.env.DB_USERNAME,
  password: isProd ? undefined : process.env.DB_PASSWORD,
  database: isProd ? undefined : process.env.DB_NAME,

  /** 👇 clave para solucionar HOY */
  synchronize: allowSync,
  dropSchema: dropAll,

  logging: true,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../**/*.entity{.js,.ts}'],
  migrations: [__dirname + '/../migrations/*{.js,.ts}'],
} as const;

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as unknown as DataSourceOptions);
