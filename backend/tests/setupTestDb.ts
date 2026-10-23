import fs from 'fs';
import path from 'path';
import { newDb, IMemoryDb } from 'pg-mem';
import { setPool } from '../src/config/db';

export const setupTestDb = () => {
  const db: IMemoryDb = newDb();

  // Load and apply schema
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.public.none(schemaSql);

  // Create pg-compatible adapter pool
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  // Set as the active database pool in our app
  setPool(pool);

  return { db, pool };
};
