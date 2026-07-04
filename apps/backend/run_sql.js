const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

const sql = `
-- 1. Cập nhật thông tin trường
UPDATE "G10HCM_SCHOOL"
SET
  address = 'Số 18, đường Lê Thúc Hoạch, Phường Phú Thọ Hoà, Thành phố Hồ Chí Minh',
  website = 'https://thpttranphu.hcm.edu.vn',
  description = 'Trường THPT Trần Phú là một trong những trường THPT công lập không chuyên có điểm chuẩn tuyển sinh lớp 10 thuộc nhóm cao nhất tại quận Tân Phú, TP.HCM. Trường toạ lạc tại số 18 đường Lê Thúc Hoạch, phường Phú Thọ Hoà. Điện thoại liên hệ: 028.3865 8727.',
  map_url = 'https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng+THPT+Tr%E1%BA%A7n+Ph%C3%BA%2C+18+L%C3%AA+Th%C3%BAc+Ho%E1%BA%A1ch%2C+Ph%C3%BA+Th%E1%BB%8D+Ho%C3%A0%2C+T%C3%A2n+Ph%C3%BA%2C+TP.HCM',
  is_active = true
WHERE code = 'TRAN_PHU';

-- 2. Điểm chuẩn năm 2024 (NV1: 23.25 | NV2: 23.25 | NV3: 23.5)
INSERT INTO "G10HCM_CUTOFF_SCORE" (school_id, year, cutoff_nv1, cutoff_nv2, cutoff_nv3, program_type, data_source)
SELECT id, 2024, 23.25, 23.25, 23.5, 'REGULAR', 'Sở GD&ĐT TP.HCM'
FROM "G10HCM_SCHOOL" WHERE code = 'TRAN_PHU'
ON CONFLICT (school_id, year, program_type)
DO UPDATE SET
  cutoff_nv1 = EXCLUDED.cutoff_nv1,
  cutoff_nv2 = EXCLUDED.cutoff_nv2,
  cutoff_nv3 = EXCLUDED.cutoff_nv3,
  data_source = EXCLUDED.data_source;

-- 3. Điểm chuẩn năm 2025 (NV1: 22.75 | NV2: 23.25 | NV3: 23.5) - ghi đè giá trị 21.75 cũ (không đúng)
INSERT INTO "G10HCM_CUTOFF_SCORE" (school_id, year, cutoff_nv1, cutoff_nv2, cutoff_nv3, program_type, data_source)
SELECT id, 2025, 22.75, 23.25, 23.5, 'REGULAR', 'Sở GD&ĐT TP.HCM'
FROM "G10HCM_SCHOOL" WHERE code = 'TRAN_PHU'
ON CONFLICT (school_id, year, program_type)
DO UPDATE SET
  cutoff_nv1 = EXCLUDED.cutoff_nv1,
  cutoff_nv2 = EXCLUDED.cutoff_nv2,
  cutoff_nv3 = EXCLUDED.cutoff_nv3,
  data_source = EXCLUDED.data_source;
`;

const checkSql = `
SELECT s.code, s.name, s.address, s.website, c.year, c.cutoff_nv1, c.cutoff_nv2, c.cutoff_nv3
FROM "G10HCM_SCHOOL" s
LEFT JOIN "G10HCM_CUTOFF_SCORE" c ON c.school_id = s.id
WHERE s.code = 'TRAN_PHU'
ORDER BY c.year DESC;
`;

async function run() {
  await client.connect();
  console.log("Connected to DB.");
  try {
    await client.query(sql);
    console.log("Update executed successfully.");
    const res = await client.query(checkSql);
    console.table(res.rows);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
