const { Client } = require('pg');
const https = require('https');

const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

const DISTRICT_COORDS = {
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 3': { lat: 10.7792, lng: 106.6806 },
  'Quận 4': { lat: 10.7580, lng: 106.7067 },
  'Quận 5': { lat: 10.7541, lng: 106.6624 },
  'Quận 6': { lat: 10.7481, lng: 106.6348 },
  'Quận 7': { lat: 10.7340, lng: 106.7216 },
  'Quận 8': { lat: 10.7224, lng: 106.6293 },
  'Quận 10': { lat: 10.7747, lng: 106.6669 },
  'Quận 11': { lat: 10.7629, lng: 106.6508 },
  'Quận 12': { lat: 10.8671, lng: 106.6366 },
  'Bình Thạnh': { lat: 10.8106, lng: 106.7091 },
  'Gò Vấp': { lat: 10.8388, lng: 106.6661 },
  'Phú Nhuận': { lat: 10.7992, lng: 106.6803 },
  'Tân Bình': { lat: 10.7997, lng: 106.6461 },
  'Tân Phú': { lat: 10.7925, lng: 106.6183 },
  'Bình Tân': { lat: 10.7654, lng: 106.5828 },
  'Thủ Đức': { lat: 10.8494, lng: 106.7537 },
  'Nhà Bè': { lat: 10.6953, lng: 106.7246 },
  'Hóc Môn': { lat: 10.8842, lng: 106.5919 },
  'Củ Chi': { lat: 10.9996, lng: 106.4950 },
  'Cần Giờ': { lat: 10.5083, lng: 106.8631 },
  'Bình Chánh': { lat: 10.6873, lng: 106.5753 }
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'AdmissionDecisionEngine/1.0 (hoa.hoang@student.com)'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      resolve(null);
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await client.connect();
  console.log("Connected to DB.");

  const res = await client.query(`
    SELECT s.id, s.name, s.address, d.name as district_name 
    FROM "G10HCM_SCHOOL" s
    LEFT JOIN "G10HCM_DISTRICT" d ON s.district_id = d.id
  `);

  console.log(`Found ${res.rows.length} schools to geocode.`);

  for (let i = 0; i < res.rows.length; i++) {
    const school = res.rows[i];
    let lat = null;
    let lng = null;

    // Try geocoding with address
    if (school.address && school.address.length > 5) {
      const query = encodeURIComponent(`${school.name}, ${school.address}, Hồ Chí Minh`);
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
      
      console.log(`[${i+1}/${res.rows.length}] Geocoding: ${school.name}...`);
      const data = await httpsGet(url);
      
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
        console.log(`  -> Found: ${lat}, ${lng}`);
      } else {
        // Try query with only school name
        const query2 = encodeURIComponent(`${school.name}, Hồ Chí Minh`);
        const url2 = `https://nominatim.openstreetmap.org/search?q=${query2}&format=json&limit=1`;
        await delay(1000); // Nominatim limit
        const data2 = await httpsGet(url2);
        if (data2 && data2.length > 0) {
          lat = parseFloat(data2[0].lat);
          lng = parseFloat(data2[0].lon);
          console.log(`  -> Found (Name only): ${lat}, ${lng}`);
        } else {
          console.log(`  -> Not found.`);
        }
      }
    }

    // Fallback to district center
    if (!lat || !lng) {
      const distName = school.district_name || '';
      const fallback = DISTRICT_COORDS[distName] || DISTRICT_COORDS['Quận 1'];
      lat = fallback.lat + (Math.random() - 0.5) * 0.01; // Slightly randomize to not overlap exactly
      lng = fallback.lng + (Math.random() - 0.5) * 0.01;
      console.log(`  -> Fallback to district ${distName}: ${lat}, ${lng}`);
    }

    // Save back to DB
    await client.query(
      'UPDATE "G10HCM_SCHOOL" SET latitude = $1, longitude = $2 WHERE id = $3',
      [lat, lng, school.id]
    );

    // Rate limiting Nominatim (1 req/sec)
    await delay(1000);
  }

  console.log("Geocoding complete!");
  await client.end();
}

run();
