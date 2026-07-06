# Grade 10 HCMC Data Completeness

## Mục đích
`% complete` cho mỗi trường dùng để cho admin biết trường nào còn thiếu dữ liệu và cần bổ sung.

## Công thức
- `completedFields` = số field đã có giá trị hợp lệ.
- `totalFields` = số field cần kiểm tra theo schema hiện tại.
- `percent` = `round(completedFields / totalFields * 100)`.

## Field profile được tính
- `address`
- `website`
- `description`
- `comments`
- `activities`
- `regulations`
- `mapUrl`
- `latitude`
- `longitude`

## Field tuyển sinh theo năm
Mỗi năm từ `2022` tới năm học gần nhất hiện tại đều tính 6 field:
- `quota`
- `registeredCount`
- `competitionRatio`
- `cutoffNV1`
- `cutoffNV2`
- `cutoffNV3`

## Ghi chú
- Công thức được tính động từ backend khi list trường, nearby schools, và sau khi `create/update` trường.
- Khi thêm field mới vào `Grade10School` hoặc schema tuyển sinh, phải cập nhật cả `DATA_COMPLETENESS_PROFILE_FIELDS` hoặc số field theo năm tương ứng.
