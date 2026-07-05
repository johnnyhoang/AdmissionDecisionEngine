-- Additional verified school profile fixes.
-- This batch fixes stale/placeholder contacts and fills GPS only when the
-- geocoder returned the exact school POI, not a nearby street segment.

WITH updates(code, address, website, latitude, longitude) AS (
  VALUES
    ('GIA_DINH', '44 đường Võ Oanh, Phường Thạnh Mỹ Tây, Thành phố Hồ Chí Minh', 'https://thptgiadinh.hcm.edu.vn', 10.8048457, 106.7186135),
    ('LE_TRONG_TAN', 'Số 5 đường D2, phường Tân Sơn Nhì, TP Hồ Chí Minh', 'https://thptletrongtan.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('NGUYEN_HUE_Q9', NULL, 'https://thptnguyenhue.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('NGUYEN_TRAI_TB', '364 Nguyễn Tất Thành, Phường Xóm Chiếu, Thành phố Hồ Chí Minh', 'https://thptnguyentrai.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('NTMK', '275 Điện Biên Phủ, TP. Hồ Chí Minh', 'https://thptnguyenthiminhkhai.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('PHU_NHUAN', 'Số 5 Hoàng Minh Giám, Phường Đức Nhuận, TPHCM', 'https://thptphunhuan.hcm.edu.vn', 10.8095054, 106.6756535),
    ('TAN_PHONG', '19F Nguyễn Văn Linh, khu dân cư ven sông, Phường Tân Hưng, TP. Hồ Chí Minh', 'https://thpttanphong.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('THANH_LOC', '116 Nguyễn Thị Sáu (TL30), Khu phố 1, phường Thạnh Lộc, Quận 12, Tp.HCM', 'https://thpt-thanhloc-tphcm.edu.vn', NULL::numeric, NULL::numeric),
    ('THU_DUC', '166/24 Đặng Văn Bi, Phường Thủ Đức, Thành phố Hồ Chí Minh', 'https://thptthuduc.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('TQT_Q3', NULL, 'https://thpttranquoctuan.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('TRUNG_LAP', '91/3 Trung Lập, ấp Trung Bình, xã Thái Mỹ, TP HCM', 'https://thpttrunglap.hcm.edu.vn', NULL::numeric, NULL::numeric),
    ('NHAN_VIET', NULL, 'https://thpttreviet.hcm.edu.vn', NULL::numeric, NULL::numeric)
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = CASE
    WHEN updates.address IS NOT NULL AND (
      s.address IS NULL
      OR btrim(s.address) = ''
      OR s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
      OR s.address ILIKE 'Trường Trung học phổ thông%'
      OR s.code IN ('GIA_DINH', 'LE_TRONG_TAN')
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
