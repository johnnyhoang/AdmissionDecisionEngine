const http = require('http');

const data = JSON.stringify({
  math: 9,
  literature: 9,
  english: 9,
  priority: 0,
  bonus: 0,
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/grade10-hcm/recommendation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer test'
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log("Total recommendations returned: " + (parsed.recommendations ? parsed.recommendations.length : "none"));
      console.log(parsed.recommendations.map(r => r.schoolName));
    } catch(e) {
      console.log("Response:", body);
    }
  });
});
req.on('error', console.error);
req.write(data);
req.end();
