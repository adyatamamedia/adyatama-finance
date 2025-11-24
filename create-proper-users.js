require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

async function createProperUsers() {
  try {
    const connection = await mysql.createConnection(connectionConfig);

    console.log('🔧 Creating proper users with correct passwords and roles...');

    // Generate proper password hashes
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    console.log('Generated admin password hash:', adminPasswordHash);
    console.log('Generated user password hash:', userPasswordHash);

    // Delete existing users and create new ones
    await connection.execute('DELETE FROM users');

    // Insert admin user
    await connection.execute(
      'INSERT INTO users (username, password, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['admin', adminPasswordHash, 'Administrator', 'admin', true]
    );

    // Insert kasir user
    await connection.execute(
      'INSERT INTO users (username, password, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['kasir', userPasswordHash, 'Kasir Toko', 'user', true]
    );

    const [users] = await connection.execute('SELECT id, username, role, is_active FROM users');
    console.log('Users created:');
    users.forEach(user => {
      console.log(`- ${user.username}: role=${user.role}, active=${user.is_active}`);
    });

    console.log('✅ Proper users created successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating proper users:', error);
  }
}

createProperUsers();