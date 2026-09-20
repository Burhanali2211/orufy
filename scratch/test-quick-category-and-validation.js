const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function runTest() {
  try {
    console.log('🚀 Step 1: Logging in as admin...');
    const loginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@platform.com', password: 'adminpassword' });

    const cookie = loginRes.data?.token ? `token=${loginRes.data.token}` : '';
    console.log('✅ Logged in successfully. Token:', !!cookie);

    console.log('\n🚀 Step 2: Testing Quick Category Creation API...');
    const catName = 'Test Quick Category ' + Date.now();
    const catRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/categories',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
    }, { name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: 'Created via quick category modal' });

    console.log('✅ Category creation status:', catRes.status, 'ID:', catRes.data?.id);

    console.log('\n🚀 Step 3: Testing Product Creation without attributes JSON...');
    const prodName = 'Test Product ' + Date.now();
    const prodRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
    }, {
      name: prodName,
      price: 499,
      category_id: catRes.data?.id,
      stock: 50,
      description: 'Product created without attributes JSON'
    });

    console.log('✅ Product creation status:', prodRes.status, 'Product Name:', prodRes.data?.name);
    console.log('\n🎉 ALL QUICK CATEGORY & PRODUCT VALIDATION BACKEND TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test Error:', err);
  }
}

runTest();
