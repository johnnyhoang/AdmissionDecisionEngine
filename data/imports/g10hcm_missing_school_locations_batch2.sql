-- Fill missing or clearly placeholder Grade 10 HCMC school location fields only.
-- Source: OpenStreetMap Nominatim geocoding, accepted only when the returned place name directly matches the school name.
-- Generated from data/imports/g10hcm_geocode_candidates.json and manually excluded ambiguous matches.

WITH updates(code, address, map_url, latitude, longitude) AS (
  VALUES
    ('NGO_QUYEN_BT', 'Trường Trung học phổ thông Ngô Quyền, 1360, Hẻm 1360 Đường Huỳnh Tấn Phát, Phường Tân Mỹ, Nhà Bè, Thành phố Hồ Chí Minh, 72915, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Ng%C3%B4%20Quy%E1%BB%81n%2010.712923%2C106.7363409', 10.712923, 106.7363409),
    ('CAN_THANH', 'Trường Trung học phổ thông Cần Thạnh, Đào Cử, Xã Cần Giờ, Thành phố Hồ Chí Minh, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20C%E1%BA%A7n%20Th%E1%BA%A1nh%2010.4035997%2C106.9495169', 10.4035997, 106.9495169),
    ('CU_CHI', 'Trường Trung học phổ thông Củ Chi, Tỉnh lộ 8, Xã Tân An Hội, Thành phố Hồ Chí Minh, 75500, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20C%E1%BB%A7%20Chi%2010.9717491%2C106.4902226', 10.9717491, 106.4902226),
    ('TTH_CC', 'Trường Trung học phổ thông Tân Thông Hội, Suối Lội, Xã Củ Chi, Thành phố Hồ Chí Minh, 71608, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20T%C3%A2n%20Th%C3%B4ng%20H%E1%BB%99i%2010.9569577%2C106.5275334', 10.9569577, 106.5275334),
    ('TRUNG_LAP', 'Trường Trung học phổ thông Trung Lập, Trung Lập, Xã Thái Mỹ, Thành phố Hồ Chí Minh, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Trung%20L%E1%BA%ADp%2011.0494866%2C106.4527541', 11.0494866, 106.4527541),
    ('NGT_GV', 'Trường Trung học phổ thông Ngô Gia Tự, 360E, Đường Bình Đông, Phường Phú Định, Thủ Đức, Thành phố Hồ Chí Minh, 71910, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Ng%C3%B4%20Gia%20T%E1%BB%B1%2010.7345197%2C106.6378023', 10.7345197, 106.6378023),
    ('NCT_GV', 'Trường Trung học phổ thông Nguyễn Công Trứ, Hẻm 872/26 Quang Trung, Khu phố 16, Phường Thông Tây Hội, Thuận An, Thành phố Hồ Chí Minh, 71427, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20C%C3%B4ng%20Tr%E1%BB%A9%2010.8389899%2C106.65325', 10.8389899, 106.65325),
    ('LONG_THOI', 'Trường Trung học phổ thông Long Thới, 280, Ngô Quang Thắm, Ấp Long Đức, Xã Hiệp Phước, Thành phố Hồ Chí Minh, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Long%20Th%E1%BB%9Bi%2010.656406%2C106.7276232', 10.656406, 106.7276232),
    ('NTD', 'Trường Trung học phổ thông Nguyễn Thị Diệu, 12, Trần Quốc Toản, Khu phố 10, Phường Xuân Hòa, Thủ Đức, Thành phố Hồ Chí Minh, 72200, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20Th%E1%BB%8B%20Di%E1%BB%87u%2010.7892921%2C106.6888629', 10.7892921, 106.6888629),
    ('LHP_CHUYEN', 'Trường Trung học phổ thông chuyên Lê Hồng Phong, 235, Nguyễn Văn Cừ, Khu phố 5, Phường Cầu Ông Lãnh, Thủ Đức, Thành phố Hồ Chí Minh, 72760, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Chuy%C3%AAn%20L%C3%AA%20H%E1%BB%93ng%20Phong%2010.7637813%2C106.6814719', 10.7637813, 106.6814719),
    ('NTMK', 'Trường Trung học phố thông Nguyễn Thị Minh Khai, 275, Điện Biên Phủ, Khu phố 6, Phường Xuân Hòa, Thủ Đức, Thành phố Hồ Chí Minh, 70000, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20Th%E1%BB%8B%20Minh%20Khai%2010.7789672%2C106.6872408', 10.7789672, 106.6872408),
    ('TRUNG_VUONG', 'Trường Trung học phổ thông Trưng Vương, 3A, Nguyễn Bỉnh Khiêm, Khu phố 1, Phường Sài Gòn, Thủ Đức, Thành phố Hồ Chí Minh, 71006, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%C6%B0ng%20V%C6%B0%C6%A1ng%2010.7853513%2C106.7064593', 10.7853513, 106.7064593),
    ('LQD', 'Trường Trung học phổ thông Lê Quý Đôn, 10, Nguyễn Thị Minh Khai, Khu phố 4, Phường Xuân Hòa, Thủ Đức, Thành phố Hồ Chí Minh, 71009, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20L%C3%AA%20Qu%C3%BD%20%C4%90%C3%B4n%2010.7796757%2C106.6940826', 10.7796757, 106.6940826),
    ('NAN_NINH', 'Trường Trung học phổ thông Nguyễn An Ninh, 93, Hẻm 46 Nguyễn Chí Thanh, Khu phố 5, Phường Vườn Lài, Thủ Đức, Thành phố Hồ Chí Minh, 72712, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20An%20Ninh%2010.7616065%2C106.6740691', 10.7616065, 106.6740691),
    ('HUNG_VUONG', 'Trường Trung học phổ thông Hùng Vương, 124, Đường Hồng Bàng, Khu phố 11, Phường Chợ Lớn, Thủ Đức, Thành phố Hồ Chí Minh, 72415, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20H%C3%B9ng%20V%C6%B0%C6%A1ng%2010.7562744%2C106.6638299', 10.7562744, 106.6638299),
    ('PHU_LAM', 'Trường Trung học phổ thông Phú Lâm, 24, Đường số 3, Phường Phú Lâm, Thủ Đức, Thành phố Hồ Chí Minh, 72015, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Ph%C3%BA%20L%C3%A2m%2010.7557279%2C106.6307126', 10.7557279, 106.6307126),
    ('THANH_LOC', 'Trường Trung học phổ thông Thạnh Lộc, 116, Nguyễn Thị Sáu, Khu phố 58, Phường An Phú Đông, Thuận An, Thành phố Hồ Chí Minh, 71515, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Th%E1%BA%A1nh%20L%E1%BB%99c%2010.8758615%2C106.6817301', 10.8758615, 106.6817301),
    ('THD_Q12', 'Trường Trung học phổ thông Trần Hưng Đạo, Hẻm 185 Đường số 28, Khu phố 38, Phường An Nhơn, Thuận An, Thành phố Hồ Chí Minh, 70000, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%E1%BA%A7n%20H%C6%B0ng%20%C4%90%E1%BA%A1o%2010.8457843%2C106.6828455', 10.8457843, 106.6828455),
    ('BTX', 'Trường Trung học phổ thông Bùi Thị Xuân, 73, Đường Lương Hữu Khánh, Khu phố 27, Phường Bến Thành, Thủ Đức, Thành phố Hồ Chí Minh, 70200, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20B%C3%B9i%20Th%E1%BB%8B%20Xu%C3%A2n%2010.76911%2C106.688169', 10.76911, 106.688169),
    ('MARIE_CURIE', 'Trường Trung học phổ thông Marie Curie, 159, Nam Kỳ Khởi Nghĩa, Khu phố 4, Phường Xuân Hòa, Thủ Đức, Thành phố Hồ Chí Minh, 70001, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Marie%20Curie%2010.782426%2C106.6907823', 10.782426, 106.6907823),
    ('TQT_Q3', 'Trường Trung học phổ thông Trần Quốc Tuấn, 236/10, Đường Thái Phiên, Khu phố 23, Phường Bình Thới, Thủ Đức, Thành phố Hồ Chí Minh, 72015, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%E1%BA%A7n%20Qu%E1%BB%91c%20Tu%E1%BA%A5n%2010.7613518%2C106.6472553', 10.7613518, 106.6472553),
    ('PBC_Q5', 'Trường Trung học cơ sở&Trung học phổ thông Phan Bội Châu Thành phố Hồ Chí Minh, Đường Nguyễn Đình Chi, Khu phố 18, Phường Bình Tây, Thủ Đức, Thành phố Hồ Chí Minh, 71910, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Phan%20B%E1%BB%99i%20Ch%C3%A2u%2010.7507647%2C106.6409969', 10.7507647, 106.6409969),
    ('TKN', 'Trường Trung học Phổ thông Trần Khai Nguyên, Nguyễn Tri Phương, Khu phố 29, Phường An Đông, Thủ Đức, Thành phố Hồ Chí Minh, 72712, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%E1%BA%A7n%20Khai%20Nguy%C3%AAn%2010.7587191%2C106.6692364', 10.7587191, 106.6692364),
    ('BINH_PHU', 'Trường Trung học phổ thông Bình Phú, 102, Đường Số 44, Khu phố 20, Phường Bình Phú, Thủ Đức, Thành phố Hồ Chí Minh, 71910, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20B%C3%ACnh%20Ph%C3%BA%2010.7353921%2C106.6275257', 10.7353921, 106.6275257),
    ('LTT_Q6', 'Trường Trung học phổ thông Lê Thánh Tôn, 124, Đường số 17, Khu phố 27, Phường Tân Hưng, Thủ Đức, Thành phố Hồ Chí Minh, 72911, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20L%C3%AA%20Th%C3%A1nh%20T%C3%B4n%2010.7453001%2C106.7106832', 10.7453001, 106.7106832),
    ('NHAN_VIET', 'Trường Trung học phổ thông Nhân Việt, 41, Hẻm 118 Huỳnh Thiện Lộc, Khu phố 20, Phường Tân Phú, Thủ Đức, Thành phố Hồ Chí Minh, 72012, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nh%C3%A2n%20Vi%E1%BB%87t%2010.7782285%2C106.6370702', 10.7782285, 106.6370702),
    ('TAN_PHONG', 'Trường Trung học phổ thông Tân Phong, 19F, Đường Số 16, Khu phố 50, Phường Tân Hưng, Thủ Đức, Thành phố Hồ Chí Minh, 72910, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20T%C3%A2n%20Phong%2010.7267658%2C106.6928185', 10.7267658, 106.6928185),
    ('NHT_Q8', 'Trường Trung học phổ thông Nguyễn Hữu Thọ, 2, Bến Vân Đồn, Phường Xóm Chiếu, Thủ Đức, Thành phố Hồ Chí Minh, 72806, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20H%E1%BB%AFu%20Th%E1%BB%8D%2010.7673003%2C106.7047184', 10.7673003, 106.7047184),
    ('LONG_TRUONG', 'Trường Trung học phổ thông Long Trường, 309, Hẻm 297 Võ Văn Hát, Phường Long Trường, Thủ Đức, Thành phố Hồ Chí Minh, 71350, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Long%20Tr%C6%B0%E1%BB%9Dng%2010.817111%2C106.8087493', 10.817111, 106.8087493),
    ('NGUYEN_HUE_Q9', 'Trường Trung học phổ thông Nguyễn Huệ, Đường số 13, Phường Long Bình, Thủ Đức, Thành phố Hồ Chí Minh, 71216, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20Hu%E1%BB%87%2010.8449428%2C106.8186124', 10.8449428, 106.8186124),
    ('HHT', 'Trường THPT Hoàng Hoa Thám, Hoàng Hoa Thám, Khu phố 4, Phường Gia Định, Thủ Đức, Thành phố Hồ Chí Minh, 72317, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Ho%C3%A0ng%20Hoa%20Th%C3%A1m%2010.8047521%2C106.6916658', 10.8047521, 106.6916658),
    ('NGUYEN_THUONG_HIEN', 'Trường Trung học phổ thông Nguyễn Thượng Hiền, 649, Hoàng Văn Thụ, Khu phố 5, Phường Tân Sơn Nhất, Thủ Đức, Thành phố Hồ Chí Minh, 72106, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20Th%C6%B0%E1%BB%A3ng%20Hi%E1%BB%81n%2010.7932827%2C106.6548169', 10.7932827, 106.6548169),
    ('NGUYEN_TRAI_TB', 'Trường Trung học phổ thông Nguyễn Trãi, 364, Nguyễn Tất Thành, Phường Xóm Chiếu, Thủ Đức, Thành phố Hồ Chí Minh, 72800, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20Tr%C3%A3i%2010.7596227%2C106.712077', 10.7596227, 106.712077),
    ('TVG', 'Trường Trung học phổ thông Trần Văn Giàu, 40, Hẻm 203 Đặng Thùy Trâm, Khu phố 48, Phường Bình Lợi Trung, Thủ Đức, Thành phố Hồ Chí Minh, 70000, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tr%E1%BA%A7n%20V%C4%83n%20Gi%C3%A0u%2010.831001%2C106.6989174', 10.831001, 106.6989174),
    ('LE_TRONG_TAN', 'Trường Trung học phổ thông Lê Trọng Tấn, 5, Đường D2, Khu phố 6, Phường Tân Sơn Nhì, Thuận An, Thành phố Hồ Chí Minh, 72008, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20L%C3%AA%20Tr%E1%BB%8Dng%20T%E1%BA%A5n%2010.8069392%2C106.6178579', 10.8069392, 106.6178579),
    ('TAY_THANH', 'Trường Trung học phổ thông Tây Thạnh, 27, Đường C2, Khu phố 8, Phường Tây Thạnh, Thuận An, Thành phố Hồ Chí Minh, 72008, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20T%C3%A2y%20Th%E1%BA%A1nh%2010.8140439%2C106.6222121', 10.8140439, 106.6222121),
    ('BINH_CHIEU', 'Trường Trung học phổ thông Bình Chiểu, Đường số 5, Khu phố 18, Phường Tam Bình, Thủ Đức, Thành phố Hồ Chí Minh, 75350, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20B%C3%ACnh%20Chi%E1%BB%83u%2010.8761158%2C106.7414875', 10.8761158, 106.7414875),
    ('HIEP_BINH', 'Trường Trung học phổ thông Hiệp Bình, Đường Số 2, Khu phố 10, Phường Hiệp Bình, Thủ Đức, Thành phố Hồ Chí Minh, 70000, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Hi%E1%BB%87p%20B%C3%ACnh%2010.8478872%2C106.7222709', 10.8478872, 106.7222709),
    ('LINH_TRUNG', 'Trường Trung học phổ thông Linh Trung, 5, Đường số 16, Khu phố 12, Phường Linh Xuân, Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Linh%20Trung%2010.8620078%2C106.7842229', 10.8620078, 106.7842229),
    ('NHH', 'Trường Trung học phổ thông Nguyễn Hữu Huân, 11, Đoàn Kết, Khu phố 14, Phường Thủ Đức, Thủ Đức, Thành phố Hồ Chí Minh, 71306, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Nguy%E1%BB%85n%20H%E1%BB%AFu%20Hu%C3%A2n%2010.8485575%2C106.7679983', 10.8485575, 106.7679983),
    ('TAM_PHU', 'Trường Trung học phổ thông Tam Phú, Phú Châu, Khu phố 30, Phường Tam Bình, Thủ Đức, Thành phố Hồ Chí Minh, 75350, Việt Nam', 'https://www.google.com/maps/search/?api=1&query=THPT%20Tam%20Ph%C3%BA%2010.8647743%2C106.7461185', 10.8647743, 106.7461185)
)
UPDATE "G10HCM_SCHOOL" s
SET
  address = CASE
    WHEN s.address IS NULL OR btrim(s.address) = ''
      OR s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
    THEN updates.address
    ELSE s.address
  END,
  map_url = CASE
    WHEN s.map_url IS NULL OR btrim(s.map_url) = ''
      OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|Nguy.*Minh.*Khai)'
    THEN updates.map_url
    ELSE s.map_url
  END,
  latitude = COALESCE(s.latitude, updates.latitude),
  longitude = COALESCE(s.longitude, updates.longitude)
FROM updates
WHERE s.code = updates.code
  AND (
    s.address IS NULL OR btrim(s.address) = ''
    OR s.address ~* '^(123|Địa chỉ: 1 |Hà Nội|Số 1, Đường Phan|Đường X|Đường XYZ|Hải Phòng)'
    OR s.map_url IS NULL OR btrim(s.map_url) = ''
    OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|Nguy.*Minh.*Khai)'
    OR s.latitude IS NULL
    OR s.longitude IS NULL
  );
