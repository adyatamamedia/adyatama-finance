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

async function resetDatabase() {
  try {
    const connection = await mysql.createConnection(connectionConfig);

    try {
      console.log('📋 Connecting to database...');
      await connection.execute(`USE \`${dbName}\``);

      console.log('🗑️ Dropping all tables...');
      const [tables] = await connection.execute('SHOW TABLES');
      if (tables.length > 0) {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
          const tableName = table[`Tables_in_${dbName}`];
          await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
          console.log(`  Dropped table: ${tableName}`);
        }
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      }
      console.log('✅ All tables dropped successfully');
    } catch (dbError) {
      console.log('📦 Database does not exist, creating fresh database...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }

    console.log('✅ Database reset completed successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

resetDatabase();