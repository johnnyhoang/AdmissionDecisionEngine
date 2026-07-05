-- Fix remaining high-confidence placeholder profiles.
-- GPS is filled only for Le Thi Hong Gam because Nominatim returned the exact
-- school POI. An Dong and PTNK returned only street segments, so GPS is left
-- null for manual verification later.

WITH updates(code, address, website, latitude, longitude) AS (
  VALUES
    ('AN_DONG_Q12', '91 Nguyễn Chí Thanh, P9, Q5, TPHCM', 'https://thptandong.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('LTHG', '147 Pasteur, Phường Xuân Hòa, thành phố Hồ Chí Minh', 'https://thptlethihonggam.hcm.edu.vn', 10.7842447, 106.6912848),
    ('NK_DHQG', '153 Nguyễn Chí Thanh, phường An Đông, Thành phố Hồ Chí Minh', 'https://ptnk.edu.vn', NULL::numeric, NULL::numeric)
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = CASE
    WHEN updates.address IS NOT NULL AND (
      s.address IS NULL
      OR btrim(s.address) = ''
      OR s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
    )
    THEN updates.address
    ELSE s.address
  END,
  website = CASE
    WHEN updates.website IS NOT NULL AND (
      s.website IS NULL
      OR btrim(s.website) = ''
      OR s.website ~* '(haam|ches|truongabc|nguyenhue|nguyenvancu|haisihighschool|amu|thptabc)'
      OR s.website = 'http://thptnguyenhue.edu.vn'
    )
    THEN updates.website
    ELSE s.website
  END,
  latitude = COALESCE(s.latitude, updates.latitude),
  longitude = COALESCE(s.longitude, updates.longitude),
  map_url = CASE
    WHEN COALESCE(s.latitude, updates.latitude) IS NOT NULL
      AND COALESCE(s.longitude, updates.longitude) IS NOT NULL
      AND (
        s.map_url IS NULL
        OR btrim(s.map_url) = ''
        OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|nguyenvancu|123)'
      )
    THEN 'https://www.google.com/maps/search/?api=1&query=' || replace(s.name, ' ', '%20') || '%20' || COALESCE(s.latitude, updates.latitude) || ',' || COALESCE(s.longitude, updates.longitude)
    ELSE s.map_url
  END,
  description = CASE
    WHEN (s.description IS NULL OR btrim(s.description) = '')
      AND updates.address IS NOT NULL
    THEN s.name || ' là cơ sở giáo dục THPT tại ' || updates.address || '.'
    ELSE s.description
  END
FROM updates
WHERE s.code = updates.code;
