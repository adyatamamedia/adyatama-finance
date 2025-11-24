require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testAPIs() {
  console.log('🧪 Testing all API endpoints...');

  const endpoints = [
    { path: '/api/auth/login', method: 'POST', data: { username: 'admin', password: 'admin123' } },
    { path: '/api/users', method: 'GET' },
    { path: '/api/categories', method: 'GET' },
    { path: '/api/customers', method: 'GET' },
    { path: '/api/transactions', method: 'GET' },
    { path: '/api/invoices', method: 'GET' },
    { path: '/api/settings', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testing ${endpoint.method} ${endpoint.path}`);

      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (endpoint.data) {
        options.body = JSON.stringify(endpoint.data);
      }

      const response = await fetch(BASE_URL + endpoint.path, options);
      const status = response.status;

      console.log(`   Status: ${status}`);

      if (status === 200 || status === 201) {
        const data = await response.json();
        console.log(`   ✅ Success - ${Array.isArray(data) ? data.length : 'object'} items`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Error: ${error.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
  }

  console.log('\n🎉 API testing completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  testAPIs();
}

module.exports = { testAPIs };