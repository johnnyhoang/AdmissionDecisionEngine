-- Fill missing Grade 10 HCMC school profile fields only.
-- Sources:
-- - THPT Binh Chanh official website: https://thptbinhchanh.hcm.edu.vn/
-- - THPT Da Phuoc official website: https://thptdaphuoc.edu.vn/homepage/gioi-thieu/t%E1%BB%95ng-quan/73-th%C3%B4ng-tin-li%C3%AAn-h%E1%BB%87.html
-- - THPT Le Minh Xuan official website: https://thptleminhxuan.hcm.edu.vn/
-- - THPT Tan Tuc official website: https://thpttantuc.hcm.edu.vn/
-- Coordinates resolved from the verified school name/address via OpenStreetMap Nominatim.

WITH updates(code, address, website, description, map_url, latitude, longitude) AS (
  VALUES
    (
      'BINH_CHANH',
      '61 Huỳnh Văn Trí, ấp 9, xã Bình Chánh, Thành phố Hồ Chí Minh',
      'https://thptbinhchanh.hcm.edu.vn',
      'Trường THPT Bình Chánh là trường THPT công lập tại xã Bình Chánh, Thành phố Hồ Chí Minh.',
      'https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20THPT%20B%C3%ACnh%20Ch%C3%A1nh%2C%2061%20Hu%E1%BB%B3nh%20V%C4%83n%20Tr%C3%AD%2C%20x%C3%A3%20B%C3%ACnh%20Ch%C3%A1nh%2C%20TP.HCM',
      10.6709382,
      106.5789789
    ),
    (
      'DA_PHUOC',
      'D14/410A ấp 41, xã Hưng Long, Thành phố Hồ Chí Minh',
      'https://thptdaphuoc.edu.vn',
      'Trường THPT Đa Phước là trường THPT công lập tại xã Hưng Long, Thành phố Hồ Chí Minh.',
      'https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20THPT%20%C4%90a%20Ph%C6%B0%E1%BB%9Bc%2C%20D14%2F410A%20%E1%BA%A5p%2041%2C%20x%C3%A3%20H%C6%B0ng%20Long%2C%20TP.HCM',
      10.6691642,
      106.6483918
    ),
    (
      'LMX',
      'G11/1, ấp 31, xã Bình Lợi, Thành phố Hồ Chí Minh',
      'https://thptleminhxuan.hcm.edu.vn',
      'Trường THPT Lê Minh Xuân là trường THPT công lập tại xã Bình Lợi, Thành phố Hồ Chí Minh.',
      'https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20THPT%20L%C3%AA%20Minh%20Xu%C3%A2n%2C%20G11%2F1%20%E1%BA%A5p%2031%2C%20x%C3%A3%20B%C3%ACnh%20L%E1%BB%A3i%2C%20TP.HCM',
      10.7690730,
      106.5533087
    ),
    (
      'TAN_TUC',
      'C1/3K, đường Bùi Thanh Khiết, ấp 59, xã Tân Nhựt, Thành phố Hồ Chí Minh',
      'https://thpttantuc.hcm.edu.vn',
      'Trường THPT Tân Túc là trường THPT công lập tại xã Tân Nhựt, Thành phố Hồ Chí Minh.',
      'https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20THPT%20T%C3%A2n%20T%C3%BAc%2C%20B%C3%B9i%20Thanh%20Khi%E1%BA%BFt%2C%20x%C3%A3%20T%C3%A2n%20Nh%E1%BB%B1t%2C%20TP.HCM',
      10.6905089,
      106.5759198
    )
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = COALESCE(NULLIF(btrim(s.address), ''), updates.address),
  website = COALESCE(NULLIF(btrim(s.website), ''), updates.website),
  description = COALESCE(NULLIF(btrim(s.description), ''), updates.description),
  map_url = COALESCE(NULLIF(btrim(s.map_url), ''), updates.map_url),
  latitude = COALESCE(s.latitude, updates.latitude),
  longitude = COALESCE(s.longitude, updates.longitude)
FROM updates
WHERE s.code = updates.code
  AND (
    s.address IS NULL OR btrim(s.address) = ''
    OR s.website IS NULL OR btrim(s.website) = ''
    OR s.description IS NULL OR btrim(s.description) = ''
    OR s.map_url IS NULL OR btrim(s.map_url) = ''
    OR s.latitude IS NULL
    OR s.longitude IS NULL
  );
