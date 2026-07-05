-- Fill additional missing or clearly incorrect Grade 10 HCMC school profile data.
-- Sources are official school/Sở GDĐT HCMC pages surfaced through hcm.edu.vn
-- and school-owned hcm.edu.vn domains. Existing non-placeholder values are
-- preserved unless the address is an OSM display string known to be less
-- accurate than the school's published contact address.

WITH updates(code, address, website) AS (
  VALUES
    ('BINH_CHIEU', 'Số 88B đường Lê Thị Hoa, phường Tam Bình, Thành phố Hồ Chí Minh', 'https://thptbinhchieu.hcm.edu.vn'),
    ('BTX', 'Số 73 đường Bùi Thị Xuân, phường Bến Thành, thành phố Hồ Chí Minh', 'https://thptbuithixuan.hcm.edu.vn'),
    ('HIEP_BINH', 'Số 63 Hiệp Bình, Phường Hiệp Bình, TP. Hồ Chí Minh', 'https://thpthiepbinh.hcm.edu.vn'),
    ('HUNG_VUONG', '124 Hồng Bàng, phường 12, quận 5, thành phố Hồ Chí Minh', 'https://thpthungvuong.hcm.edu.vn'),
    ('LHP_CHUYEN', '235 Nguyễn Văn Cừ, phường Chợ Quán, TP. Hồ Chí Minh', 'https://www.thpt-lehongphong-tphcm.edu.vn'),
    ('LINH_TRUNG', 'Số 5 Đường 16, phường Linh Xuân, Thành phố Hồ Chí Minh', 'https://thptlinhtrung.hcm.edu.vn'),
    ('LONG_THOI', '280 Nguyễn Văn Tạo, ấp 17, xã Hiệp Phước, TP.HCM', 'https://thptlongthoi.hcm.edu.vn'),
    ('LONG_TRUONG', '309 Võ Văn Hát, Khu phố Phước Hiệp, phường Long Trường, TP. Thủ Đức', 'https://thptlongtruong.hcm.edu.vn'),
    ('NAN_NINH', 'Số 93 Trần Nhân Tôn, Phường Vườn Lài, TP. Hồ Chí Minh', 'https://thptnguyenanninh.hcm.edu.vn'),
    ('NGT_GV', '360E Bến Bình Đông, Phường Phú Định, TPHCM', 'https://thptngogiatu.hcm.edu.vn'),
    ('NHH', '11 Đoàn Kết, phường Thủ Đức, Thành phố Hồ Chí Minh', 'https://thptnguyenhuuhuan.hcm.edu.vn'),
    ('NHT_Q8', 'Số 02 Bến Vân Đồn, Phường 13, Quận 4, TP. Hồ Chí Minh', 'https://thptnguyenhuutho.hcm.edu.vn'),
    ('NTD', 'Số 12 Trần Quốc Toản, phường Xuân Hòa, TP. Hồ Chí Minh', 'https://thptnguyenthidieu.hcm.edu.vn'),
    ('NTMK', '275 Điện Biên Phủ, TP. Hồ Chí Minh', 'https://thptnguyenthiminhkhai.hcm.edu.vn'),
    ('TAM_PHU', '31 Phú Châu, Phường Tam Bình, Thành phố Hồ Chí Minh', 'https://thpttamphu.hcm.edu.vn'),
    ('TAY_THANH', 'Số 27 Đường C2, Phường Tây Thạnh, Thành phố Hồ Chí Minh', 'https://thpttaythanh.hcm.edu.vn'),
    ('THD_Q12', '88/955E Lê Đức Thọ, Phường An Nhơn, Thành Phố Hồ Chí Minh', 'https://thpttranhungdao.hcm.edu.vn'),
    ('TKN', '225 Nguyễn Tri Phương, Phường An Đông, Thành Phố Hồ Chí Minh', 'https://thpttrankhainguyen.hcm.edu.vn'),
    ('TVG', '203/40 Đường Đặng Thùy Trâm, P.13, Q.Bình Thạnh', 'https://thpttranvangiau.hcm.edu.vn')
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = CASE
    WHEN updates.address IS NOT NULL AND (
      s.address IS NULL
      OR btrim(s.address) = ''
      OR s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
      OR s.address ILIKE 'Trường Trung học phổ thông%'
      OR s.address ILIKE 'Trường Trung học phố thông%'
    )
    THEN updates.address
    ELSE s.address
  END,
  website = CASE
    WHEN updates.website IS NOT NULL AND (
      s.website IS NULL
      OR btrim(s.website) = ''
      OR s.website ~* '(haam|ches|truongabc|nguyenhue|nguyenvancu|haisihighschool|amu|thptabc)'
    )
    THEN updates.website
    ELSE s.website
  END,
  map_url = CASE
    WHEN s.latitude IS NOT NULL AND s.longitude IS NOT NULL AND (
      s.map_url IS NULL
      OR btrim(s.map_url) = ''
      OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|nguyenvancu|123)'
    )
    THEN 'https://www.google.com/maps/search/?api=1&query=' || replace(s.name, ' ', '%20') || '%20' || s.latitude || ',' || s.longitude
    ELSE s.map_url
  END
FROM updates
WHERE s.code = updates.code;
