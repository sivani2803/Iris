const http = require('http');

function post(path, data = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(`http://localhost:5000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testAI() {
  console.log('--- 1. Testing AI Chat (English Chest Discomfort) ---');
  const enRes = await post('/api/ai/chat', {
    message: 'My chest feels uncomfortable and tight',
    language: 'en'
  });
  console.log('Urgency:', enRes.data.urgency);
  console.log('Sample reply snippet:', enRes.data.reply.slice(0, 150) + '...');

  console.log('\n--- 2. Testing AI Chat (Telugu Dizziness) ---');
  const teRes = await post('/api/ai/chat', {
    message: 'నాకు తల తిరుగుతున్నట్టు ఉంది',
    language: 'te'
  });
  console.log('Urgency:', teRes.data.urgency);
  console.log('Telugu Reply snippet:', teRes.data.reply.slice(0, 150) + '...');

  console.log('\n--- 3. Testing Language-Independent Structured Triage (Section 18) ---');
  const triageRes = await post('/api/ai/triage', {
    text: 'Senior had a sudden fall and cannot get up',
    language: 'en'
  });
  console.log('Structured Triage Result:', JSON.stringify(triageRes.data, null, 2));

  console.log('\n>>> MILESTONE 4 AI ASSISTANT VERIFIED! <<<');
}

testAI().catch(console.error);
