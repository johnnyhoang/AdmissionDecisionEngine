-- Final safe profile cleanup in this pass:
-- - fill Phan Boi Chau from its official hcm.edu.vn profile
-- - replace bad/missing map URLs with address-based Google Maps searches for
--   records that have verified official addresses but no exact GPS yet

WITH profile_updates(code, address, website) AS (
  VALUES
    ('PBC_Q5', '293-299 Nguyễn Đình Chi, Phường Bình Tây, TP. Hồ Chí Minh', 'https://thcs-thptphanboichau.hcm.edu.vn')
),
map_updates(code, map_url) AS (
  VALUES
    ('AN_DONG_Q12', 'https://www.google.com/maps/search/?api=1&query=THCS%20THPT%20An%20Dong%2091%20Nguyen%20Chi%20Thanh%20Q5%20TPHCM'),
    ('NK_DHQG', 'https://www.google.com/maps/search/?api=1&query=Truong%20Pho%20thong%20Nang%20khieu%20153%20Nguyen%20Chi%20Thanh%20TPHCM'),
    ('THU_DUC', 'https://www.google.com/maps/search/?api=1&query=THPT%20Thu%20Duc%20166%2F24%20Dang%20Van%20Bi%20TPHCM')
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = COALESCE(profile_updates.address, s.address),
  website = CASE
    WHEN profile_updates.website IS NOT NULL AND (
      s.website IS NULL
      OR btrim(s.website) = ''
      OR s.website ~* '(haam|ches|truongabc|nguyenhue|nguyenvancu|haisihighschool|amu|thptabc)'
      OR s.website = 'http://thptnguyenhue.edu.vn'
    )
    THEN profile_updates.website
    ELSE s.website
  END,
  map_url = CASE
    WHEN map_updates.map_url IS NOT NULL AND (
      s.map_url IS NULL
      OR btrim(s.map_url) = ''
      OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|nguyenvancu|123)'
    )
    THEN map_updates.map_url
    ELSE s.map_url
  END,
  description = CASE
    WHEN (s.description IS NULL OR btrim(s.description) = '')
      AND profile_updates.address IS NOT NULL
    THEN s.name || ' là cơ sở giáo dục THPT tại ' || profile_updates.address || '.'
    ELSE s.description
  END
FROM (
  SELECT COALESCE(profile_updates.code, map_updates.code) AS code,
         profile_updates.address,
         profile_updates.website,
         map_updates.map_url
  FROM profile_updates
  FULL OUTER JOIN map_updates ON map_updates.code = profile_updates.code
) updates
LEFT JOIN profile_updates ON profile_updates.code = updates.code
LEFT JOIN map_updates ON map_updates.code = updates.code
WHERE s.code = updates.code;
