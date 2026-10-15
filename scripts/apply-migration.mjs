import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:1591@localhost:5432/circle'
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE rate_limits ADD COLUMN id text NOT NULL');
    console.log('Column added successfully');
  } catch (err) {
    // Column might already exist
    if (err.message.includes('already exists')) {
      console.log('Column already exists');
    } else {
      console.error('Error:', err);
    }
  } finally {
    await pool.end();
  }
}

main();