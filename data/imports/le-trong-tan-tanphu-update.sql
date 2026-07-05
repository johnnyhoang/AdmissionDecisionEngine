-- Cập nhật chỉ tiêu, đăng ký NV1 và điểm chuẩn cho THPT Lê Trọng Tấn (Tân Phú, TP.HCM)
-- Dữ liệu theo bảng người dùng cung cấp ngày 2026-07-05.
-- Năm học 2022-2023 lưu year = 2023; 2025-2026 lưu year = 2026.
-- Chạy script này trong Supabase Dashboard > SQL Editor.

WITH tan_phu_district AS (
  SELECT id
  FROM "G10HCM_DISTRICT"
  WHERE code IN ('QTP', 'TAN_PHU')
     OR name ILIKE '%Tân Phú%'
  ORDER BY
    CASE
      WHEN code = 'QTP' THEN 1
      WHEN code = 'TAN_PHU' THEN 2
      ELSE 3
    END
  LIMIT 1
),
upsert_school AS (
  INSERT INTO "G10HCM_SCHOOL" (
    district_id,
    code,
    name,
    school_type,
    description,
    is_active,
    is_verified
  )
  SELECT
    id,
    'LE_TRONG_TAN',
    'THPT Lê Trọng Tấn',
    'REGULAR',
    'Trường THPT công lập tại quận Tân Phú, TP.HCM. Dữ liệu tuyển sinh lớp 10 đang được cập nhật theo các năm học 2022-2023 đến 2025-2026.',
    true,
    false
  FROM tan_phu_district
  ON CONFLICT (code)
  DO UPDATE SET
    district_id = COALESCE("G10HCM_SCHOOL".district_id, EXCLUDED.district_id),
    name = EXCLUDED.name,
    school_type = EXCLUDED.school_type,
    description = COALESCE("G10HCM_SCHOOL".description, EXCLUDED.description),
    is_active = true
  RETURNING id
),
target_school AS (
  SELECT id FROM upsert_school
  UNION ALL
  SELECT id FROM "G10HCM_SCHOOL" WHERE code = 'LE_TRONG_TAN'
  LIMIT 1
),
quota_rows AS (
  SELECT 2023 AS year, 675 AS quota, NULL::integer AS registered_count, NULL::decimal AS competition_ratio
  UNION ALL SELECT 2024, 675, 937, 1.39
  UNION ALL SELECT 2025, 630, 781, 1.24
  UNION ALL SELECT 2026, 650, NULL::integer, NULL::decimal
)
INSERT INTO "G10HCM_QUOTA" (
  school_id,
  year,
  quota,
  registered_count,
  competition_ratio,
  program_type
)
SELECT
  target_school.id,
  quota_rows.year,
  quota_rows.quota,
  quota_rows.registered_count,
  quota_rows.competition_ratio,
  'REGULAR'
FROM target_school
CROSS JOIN quota_rows
ON CONFLICT (school_id, year, program_type)
DO UPDATE SET
  quota = EXCLUDED.quota,
  registered_count = EXCLUDED.registered_count,
  competition_ratio = EXCLUDED.competition_ratio;

WITH target_school AS (
  SELECT id FROM "G10HCM_SCHOOL" WHERE code = 'LE_TRONG_TAN' LIMIT 1
),
cutoff_rows AS (
  SELECT 2023 AS year, 18.50::decimal AS cutoff_nv1, 18.75::decimal AS cutoff_nv2, 19.00::decimal AS cutoff_nv3
  UNION ALL SELECT 2024, 20.25, 20.50, 20.75
  UNION ALL SELECT 2025, 19.50, 19.75, 20.00
  UNION ALL SELECT 2026, 18.50, 19.25, 20.00
)
INSERT INTO "G10HCM_CUTOFF_SCORE" (
  school_id,
  year,
  cutoff_nv1,
  cutoff_nv2,
  cutoff_nv3,
  program_type,
  data_source
)
SELECT
  target_school.id,
  cutoff_rows.year,
  cutoff_rows.cutoff_nv1,
  cutoff_rows.cutoff_nv2,
  cutoff_rows.cutoff_nv3,
  'REGULAR',
  'User-provided admission data, 2026-07-05'
FROM target_school
CROSS JOIN cutoff_rows
ON CONFLICT (school_id, year, program_type)
DO UPDATE SET
  cutoff_nv1 = EXCLUDED.cutoff_nv1,
  cutoff_nv2 = EXCLUDED.cutoff_nv2,
  cutoff_nv3 = EXCLUDED.cutoff_nv3,
  data_source = EXCLUDED.data_source;

-- Kiểm tra kết quả
SELECT
  s.code,
  s.name,
  q.year,
  q.quota,
  q.registered_count,
  q.competition_ratio,
  c.cutoff_nv1,
  c.cutoff_nv2,
  c.cutoff_nv3
FROM "G10HCM_SCHOOL" s
LEFT JOIN "G10HCM_QUOTA" q ON q.school_id = s.id
LEFT JOIN "G10HCM_CUTOFF_SCORE" c
  ON c.school_id = s.id
 AND c.year = q.year
 AND c.program_type = q.program_type
WHERE s.code = 'LE_TRONG_TAN'
ORDER BY q.year DESC;
