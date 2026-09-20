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
    console.log('🚀 Step 1: Registering merchant user...');
    const email = `cat_merchant_${Date.now()}@example.com`;
    const password = 'Password123!';
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password, fullName: 'Category Tester', role: 'merchant' });

    const token = regRes.data?.token;
    console.log('✅ Registered merchant status:', regRes.status, 'Token acquired:', !!token);

    console.log('\n🚀 Step 2: Onboarding Store...');
    const slug = `quickcatstore${Date.now()}`;
    const onboardRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/platform/onboarding',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      business: { name: 'Quick Cat Store', subdomain: slug, category: 'General', country: 'India', currency: 'INR' }
    });
    const storeHost = onboardRes.data?.hostname || `${slug}.get-oru.com`;
    console.log('✅ Store onboarded status:', onboardRes.status, 'Host:', storeHost);

    console.log('\n🚀 Step 3: Testing Quick Category Creation API...');
    const catName = 'Test Quick Category ' + Date.now();
    const catRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/categories',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-store-hostname': storeHost
      }
    }, { name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: 'Created via quick category modal' });

    console.log('✅ Category creation status:', catRes.status, 'ID:', catRes.data?.id);

    console.log('\n🚀 Step 4: Testing Product Creation without attributes JSON...');
    const prodName = 'Test Product ' + Date.now();
    const prodRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/products',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-store-hostname': storeHost
      }
    }, {
      name: prodName,
      price: 499,
      category_id: catRes.data?.id,
      stock: 50,
      description: 'Product created without attributes JSON'
    });

    console.log('✅ Product creation status:', prodRes.status, 'Product Name:', prodRes.data?.name);
    
    if (catRes.status === 201 && prodRes.status === 201) {
      console.log('\n🎉 ALL QUICK CATEGORY & PRODUCT BACKEND API TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('\n❌ Test failed: unexpected status codes.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test Error:', err);
    process.exit(1);
  }
}

runTest();
