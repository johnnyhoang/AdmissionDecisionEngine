-- Manual school profile import from D:\Temp\thong_tin_truong_thpt_hoan_thien.csv
-- Import rule: fill missing or placeholder profile fields only. Preserve existing
-- verified official values unless the current value is known placeholder/wrong.

WITH updates(code, name, address, website, latitude, longitude, map_url, description) AS (
  VALUES
    ('AN_DONG_Q12', 'THPT An Đông', '91 Nguyễn Chí Thanh, Phường 9, Quận 5, TP.HCM', 'http://thptandong.edu.vn', 10.7571, 106.6692, 'https://maps.google.com/?q=10.7571,106.6692', 'Trường THCS - THPT An Đông thành lập từ năm 1996, môi trường giáo dục chất lượng.'),
    ('BAN_CO', 'THPT Bàn Cờ', 'Khu Cư Xá Đô Thành, Phường 4, Quận 3, TP.HCM', 'http://thptbanco.edu.vn', 10.7745, 106.6805, 'https://maps.google.com/?q=10.7745,106.6805', 'Trường THPT Bàn Cờ nằm tại trung tâm Quận 3 với bề dày truyền thống dạy và học.'),
    ('BINH_DONG', 'THPT Bình Đông', 'Ấp Muôn Nghiệp, Xã Bình Đông, Thị xã Gò Công, Tiền Giang (Tuyển sinh khu vực lân cận TP.HCM)', 'http://thptbinhdong.edu.vn', 10.3952, 106.6912, 'https://maps.google.com/?q=10.3952,106.6912', 'Trường THPT Bình Đông phục vụ con em khu vực Bình Đông và lân cận.'),
    ('CAN_GIO', 'THPT Cần Giờ', 'Duyên Hải, Thị trấn Cần Thạnh, Huyện Cần Giờ, TP.HCM', 'http://thptcangio.hcm.edu.vn', 10.4136, 106.9556, 'https://maps.google.com/?q=10.4136,106.9556', 'Trường THPT Cần Giờ là ngôi trường trọng điểm tại huyện duyên hải Cần Giờ.'),
    ('NK_DHQG', 'THPT Chuyên Năng Khiếu ĐHQG', '153 Nguyễn Chí Thanh, Phường 9, Quận 5, TP.HCM', 'http://ptnk.edu.vn', 10.7579, 106.6659, 'https://maps.google.com/?q=10.7579,106.6659', 'Trường THPT Chuyên Năng khiếu thuộc Đại học Quốc gia TP.HCM, trường chuyên hàng đầu.'),
    ('DONG_THANH', 'THPT Đông Thạnh', 'Xã Đông Thạnh, Huyện Hóc Môn, TP.HCM', 'http://thptdongthanh.hcm.edu.vn', 10.8932, 106.6431, 'https://maps.google.com/?q=10.8932,106.6431', 'Trường THPT Đông Thạnh đáp ứng nhu cầu học tập của học sinh huyện Hóc Môn.'),
    ('HIEP_PHU', 'THPT Hiệp Phú', 'Khu phố 4, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM', 'http://thpthiepphu.edu.vn', 10.8462, 106.7785, 'https://maps.google.com/?q=10.8462,106.7785', 'Trường THPT Hiệp Phú khang trang và hiện đại tại khu vực Thủ Đức.'),
    ('HOC_MON', 'THPT Hóc Môn', '12 Lý Thường Kiệt, Thị trấn Hóc Môn, Huyện Hóc Môn, TP.HCM', 'http://thpthocmon.hcm.edu.vn', 10.8856, 106.5982, 'https://maps.google.com/?q=10.8856,106.5982', 'Trường THPT Hóc Môn có truyền thống đào tạo lâu năm tại huyện Hóc Môn.'),
    ('KHANH_HOI_A', 'THPT Khánh Hội A', '360A Bến Vân Đồn, Phường 1, Quận 4, TP.HCM', 'http://thptkhanhhoia.edu.vn', 10.7543, 106.7112, 'https://maps.google.com/?q=10.7543,106.7112', 'Trường THPT Khánh Hội A tọa lạc tại Quận 4, phục vụ học sinh khu vực Khánh Hội.'),
    ('LVT_Q8', 'THPT Lê Văn Thiêm', 'Quận 8, TP.HCM', 'http://thptlevanthiem.edu.vn', 10.7381, 106.6575, 'https://maps.google.com/?q=10.7381,106.6575', 'Trường THPT Lê Văn Thiêm phục vụ nhu cầu học tập của học sinh Quận 8.'),
    ('LONG_BINH', 'THPT Long Bình', 'Phường Long Bình, TP. Thủ Đức, TP.HCM', 'http://thptlongbinh.edu.vn', 10.8761, 106.8225, 'https://maps.google.com/?q=10.8761,106.8225', 'Trường THPT Long Bình là trường công lập tại khu vực Long Bình, TP. Thủ Đức.'),
    ('NGT', 'THPT Nguyễn Gia Thiều', 'Quận Tân Phú, TP.HCM', 'http://thptnguyengiathieu.hcm.edu.vn', 10.8012, 106.6321, 'https://maps.google.com/?q=10.8012,106.6321', 'Trường THPT Nguyễn Gia Thiều mang tên danh nhân văn học, chú trọng chất lượng giáo dục toàn diện.'),
    ('NHA_BE', 'THPT Nhà Bè', 'Huyện Nhà Bè, TP.HCM', 'http://thptnhabe.hcm.edu.vn', 10.6953, 106.7214, 'https://maps.google.com/?q=10.6953,106.7214', 'Trường THPT Nhà Bè là trường THPT công lập phục vụ học sinh huyện Nhà Bè.'),
    ('PVC', 'THPT Phạm Văn Cội', 'Xã Phạm Văn Cội, Huyện Củ Chi, TP.HCM', 'http://thptphamvancoi.hcm.edu.vn', 11.1012, 106.5543, 'https://maps.google.com/?q=11.1012,106.5543', 'Trường THPT Phạm Văn Cội phục vụ học sinh khu vực phía Bắc TP.HCM.'),
    ('PDP', 'THPT Phan Đình Phùng', 'Quận Phú Nhuận, TP.HCM', 'http://thptphandinhphung.edu.vn', 10.7963, 106.6812, 'https://maps.google.com/?q=10.7963,106.6812', 'Trường THPT Phan Đình Phùng có truyền thống giáo dục tại khu vực Phú Nhuận.'),
    ('PHD_CC', 'THPT Phú Hoà Đông', 'Xã Phú Hòa Đông, Huyện Củ Chi, TP.HCM', 'http://thptphuhoadong.hcm.edu.vn', 11.0452, 106.5714, 'https://maps.google.com/?q=11.0452,106.5714', 'Trường THPT Phú Hoà Đông phục vụ học sinh khu vực Phú Hòa Đông, Củ Chi.'),
    ('PHU_LAM', 'THPT Phú Lâm', '24 Đường số 3, Phường Phú Lâm, Quận 6, TP.HCM', 'http://thptphulam.edu.vn', 10.7495, 106.6212, 'https://maps.google.com/?q=10.7495,106.6212', 'Trường THPT Phú Lâm là cơ sở giáo dục phổ thông tại khu vực Phú Lâm.'),
    ('PHU_MY', 'THPT Phú Mỹ', 'Quận 7, TP.HCM', 'http://thptphumy.edu.vn', 10.7162, 106.7325, 'https://maps.google.com/?q=10.7162,106.7325', 'Trường THPT Phú Mỹ phục vụ học sinh khu vực Quận 7 và lân cận.'),
    ('TAN_PHU_TRUNG', 'THPT Tân Phú Trung', 'Xã Tân Phú Trung, Huyện Củ Chi, TP.HCM', 'http://thpttanphutrung.hcm.edu.vn', 10.9324, 106.5312, 'https://maps.google.com/?q=10.9324,106.5312', 'Trường THPT Tân Phú Trung là trường THPT công lập tại huyện Củ Chi.'),
    ('TTH', 'THPT Thông Tây Hội', 'Phường Thông Tây Hội, Quận Gò Vấp, TP.HCM', 'http://thptthongtayhoi.edu.vn', 10.8291, 106.6612, 'https://maps.google.com/?q=10.8291,106.6612', 'Trường THPT Thông Tây Hội phục vụ học sinh khu vực Gò Vấp.'),
    ('THU_DUC', 'THPT Thủ Đức', '166/24 Đặng Văn Bi, TP. Thủ Đức, TP.HCM', 'http://thptthuduc.hcm.edu.vn', 10.8351, 106.7618, 'https://maps.google.com/?q=10.8351,106.7618', 'Trường THPT Thủ Đức là trường THPT lâu đời tại khu vực Thủ Đức.'),
    ('TON_DUC_THANG', 'THPT Tôn Đức Thắng', 'Quận 1, TP.HCM', 'http://thpttonducthang.edu.vn', 10.7812, 106.7045, 'https://maps.google.com/?q=10.7812,106.7045', 'Trường THPT Tôn Đức Thắng được đặt theo tên Chủ tịch Tôn Đức Thắng.'),
    ('TPHCM', 'THPT TPHCM', 'Quận 1, TP.HCM', 'http://thpttphcm.edu.vn', 10.7756, 106.6985, 'https://maps.google.com/?q=10.7756,106.6985', 'Trường THPT TPHCM là cơ sở giáo dục phổ thông tại trung tâm Thành phố Hồ Chí Minh.'),
    ('TRUNG_CHANH', 'THPT Trung Chánh', 'Xã Trung Chánh, Huyện Hóc Môn, TP.HCM', 'http://thpttrungchanh.hcm.edu.vn', 10.8643, 106.6112, 'https://maps.google.com/?q=10.8643,106.6112', 'Trường THPT Trung Chánh phục vụ học sinh khu vực Trung Chánh và lân cận.'),
    ('TRUONG_THANH', 'THPT Trường Thạnh', 'Phường Trường Thạnh, TP. Thủ Đức, TP.HCM', 'http://thpttruongthanh.edu.vn', 10.8142, 106.8295, 'https://maps.google.com/?q=10.8142,106.8295', 'Trường THPT Trường Thạnh nằm tại khu vực Trường Thạnh, TP. Thủ Đức.'),
    ('VVN', 'THPT Võ Văn Ngân', 'TP. Thủ Đức, TP.HCM', 'http://thptvovanngan.hcm.edu.vn', 10.8521, 106.7712, 'https://maps.google.com/?q=10.8521,106.7712', 'Trường THPT Võ Văn Ngân phục vụ học sinh khu vực Thủ Đức.')
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
      OR s.website ~* '(haam|ches|truongabc|nguyenvancu|haisihighschool|amu|thptabc)'
      OR s.website = 'http://thptnguyenhue.edu.vn'
    )
    THEN updates.website
    ELSE s.website
  END,
  latitude = COALESCE(s.latitude, updates.latitude),
  longitude = COALESCE(s.longitude, updates.longitude),
  map_url = CASE
    WHEN updates.map_url IS NOT NULL AND (
      s.map_url IS NULL
      OR btrim(s.map_url) = ''
      OR s.map_url ~* '(abcdef|example|xxxx|Amsterdam|nguyenvancu|123|Phan.Đình.Giót)'
      OR s.latitude IS NULL
      OR s.longitude IS NULL
    )
    THEN updates.map_url
    ELSE s.map_url
  END,
  description = CASE
    WHEN updates.description IS NOT NULL AND (
      s.description IS NULL
      OR btrim(s.description) = ''
    )
    THEN updates.description
    ELSE s.description
  END
FROM updates
WHERE s.code = updates.code;
