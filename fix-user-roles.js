require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
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

async function fixUserRoles() {
  try {
    const connection = await mysql.createConnection(connectionConfig);

    console.log('🔧 Fixing user roles...');

    // Update roles from uppercase to lowercase
    await connection.execute("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'");
    await connection.execute("UPDATE users SET role = 'user' WHERE role = 'USER'");

    const [users] = await connection.execute('SELECT id, username, role, is_active FROM users');
    console.log('Users after fix:');
    users.forEach(user => {
      console.log(`- ${user.username}: role=${user.role}, active=${user.is_active}`);
    });

    console.log('✅ User roles fixed successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
  }
}

fixUserRoles();