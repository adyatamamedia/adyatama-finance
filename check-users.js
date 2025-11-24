require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.name}) - Role: ${user.role} - Active: ${user.isActive}`);
      console.log(`  Password hash: ${user.password.substring(0, 30)}...`);
    });

    // Test password verification
    if (users.length > 0) {
      console.log('\n🔐 Testing password verification...');

      const testPasswords = ['admin123', 'user123'];

      for (const user of users) {
        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, user.password);
            console.log(`${user.username} + '${testPassword}': ${isValid ? '✅ Valid' : '❌ Invalid'}`);
          } catch (error) {
            console.log(`${user.username} + '${testPassword}': ❌ Error - ${error.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();