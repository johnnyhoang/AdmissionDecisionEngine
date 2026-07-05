-- Verified exact-name update for THPT Tan Binh.

UPDATE "G10HCM_SCHOOL"
SET
  address = 'Số 19 Đường Hoa Bằng, Phường Tân Sơn Nhì, Thành phố Hồ Chí Minh',
  website = 'https://thpttanbinh.hcm.edu.vn',
  latitude = 10.7990599,
  longitude = 106.6282137,
  map_url = 'https://www.google.com/maps/search/?api=1&query=THPT%20Tan%20Binh%2010.7990599,106.6282137',
  description = CASE
    WHEN description IS NULL OR btrim(description) = ''
    THEN 'THPT Tân Bình là cơ sở giáo dục THPT tại Số 19 Đường Hoa Bằng, Phường Tân Sơn Nhì, Thành phố Hồ Chí Minh.'
    ELSE description
  END
WHERE code = 'TAN_BINH_TP';
