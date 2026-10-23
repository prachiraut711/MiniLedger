import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in environment or backend/.env file.');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL at:', connectionString.replace(/:[^:@]*@/, ':****@'));
  const pool = new Pool({ connectionString });

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📦 Executing schema.sql...');

    await pool.query(schemaSql);
    console.log('✅ Database schema initialized successfully! Tables: users, loans');
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database initialization failed:');
    if (err.code === 'ECONNREFUSED') {
      console.error('   Could not connect to PostgreSQL. Is PostgreSQL running on the specified host & port?');
    } else if (err.code === '3D000') {
      console.error('   The specified database does not exist. Please create it first (e.g. `createdb miniledger` or `CREATE DATABASE miniledger;`).');
    } else if (err.code === '28P01') {
      console.error('   Authentication failed: invalid username or password in DATABASE_URL.');
    } else {
      console.error('  ', err.message || err);
    }
    await pool.end();
    process.exit(1);
  }
}

initDb();
