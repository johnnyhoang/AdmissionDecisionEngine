-- Fill remaining verified Grade 10 HCMC school info fields.
-- - Coordinates for TRAN_PHU are from OpenStreetMap Nominatim and accepted
--   because the returned place name directly matches THPT Tran Phu.
-- - Descriptions are generated only for schools that already have address and
--   GPS coordinates, and only when description is missing.

UPDATE "G10HCM_SCHOOL"
SET
  latitude = COALESCE(latitude, 10.7871256),
  longitude = COALESCE(longitude, 106.6255149),
  map_url = COALESCE(
    NULLIF(btrim(map_url), ''),
    'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%E1%BA%A7n%20Ph%C3%BA%2010.7871256%2C106.6255149'
  )
WHERE code = 'TRAN_PHU'
  AND (
    latitude IS NULL
    OR longitude IS NULL
    OR map_url IS NULL
    OR btrim(map_url) = ''
  );

UPDATE "G10HCM_SCHOOL" s
SET description = concat(
  s.name,
  ' là cơ sở giáo dục THPT tại ',
  s.address,
  '.'
)
WHERE s.is_active = true
  AND (s.description IS NULL OR btrim(s.description) = '')
  AND s.address IS NOT NULL
  AND btrim(s.address) <> ''
  AND s.latitude IS NOT NULL
  AND s.longitude IS NOT NULL
  AND NOT (
    s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
    OR coalesce(s.website, '') ~* '(haam|ches|truongabc|nguyenhue|nguyenvancu|haisihighschool|amu|thptabc)'
    OR coalesce(s.map_url, '') ~* '(abcdef|example|xxxx|Amsterdam|Nguy.*Minh.*Khai)'
  );
