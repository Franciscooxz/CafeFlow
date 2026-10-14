import { testDatabaseUrl } from './database-url';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = 'test';
