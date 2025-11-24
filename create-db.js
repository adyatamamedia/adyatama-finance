require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const url = require('url');

const dbUrl = url.parse(process.env.DATABASE_URL);
const dbName = dbUrl.pathname.substring(1);
const connectionConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port || 3306,
  user: dbUrl.auth.split(':')[0],
  password: dbUrl.auth.split(':')[1]
};

async function createDatabase() {
  try {
    const connection = await mysql.createConnection(connectionConfig);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Database created or already exists');
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating database:', error);
  }
}

createDatabase();