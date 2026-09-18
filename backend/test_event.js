const http = require('http');

const data = JSON.stringify({
  seniorId: 'S102',
  heartRate: 145,
  spo2: 91,
  motionState: 'stationary',
  fallDetected: true,
  eventType: 'fall'
});

const req = http.request('http://localhost:5000/api/emergency/health-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(data);
req.end();
