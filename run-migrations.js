require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const url = require('url');

const dbUrl = url.parse(process.env.DATABASE_URL);
const dbName = dbUrl.pathname.substring(1);
const connectionConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port || 3306,
  user: dbUrl.auth.split(':')[0],
  password: dbUrl.auth.split(':')[1],
  database: dbName
};

async function runMigrations() {
  try {
    console.log('🔄 Starting migrations...');

    const connection = await mysql.createConnection(connectionConfig);

    const migrationsDir = path.join(__dirname, 'prisma/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);

      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log(`Migration file content for ${file}:`);
      console.log(migrationSQL.substring(0, 500) + '...');

      // Split migration file by semicolons and execute each statement
      const rawStatements = migrationSQL.split(';');
      console.log(`Split into ${rawStatements.length} raw statements`);

      const statements = migrationSQL
        .split(';')
        .map(stmt => {
          // Remove comments and clean up whitespace
          const cleanedStmt = stmt
            .split('\n')
            .filter(line => !line.trim().startsWith('--')) // Remove comment lines
            .join(' ') // Join with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          return cleanedStmt;
        })
        .filter(stmt => stmt.length > 0);

      console.log(`Found ${statements.length} statements to execute in ${file}`);

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 100)}...`);
          await connection.execute(statement);
        }
      }

      console.log(`✅ Migration ${file} completed`);
    }

    console.log('🎉 All migrations completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };