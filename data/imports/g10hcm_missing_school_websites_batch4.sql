-- Fill missing or clearly wrong Grade 10 HCMC school website fields only.
-- Sources are official school websites returned by web search/Sở GD&ĐT listings.

WITH updates(code, website) AS (
  VALUES
    ('NGO_QUYEN_BT', 'https://thptngoquyen.hcm.edu.vn'),
    ('CAN_THANH', 'https://thptcanthanh.hcm.edu.vn'),
    ('CU_CHI', 'https://thptcuchi.hcm.edu.vn'),
    ('TTH_CC', 'https://thpttanthonghoi.hcm.edu.vn'),
    ('LQD', 'https://www.thpt-lequydon-hcm.edu.vn'),
    ('LTHG', 'https://thptlethihonggam.hcm.edu.vn'),
    ('NCT_GV', 'https://thptnguyencongtru.hcm.edu.vn'),
    ('HHT', 'https://thpthoanghoatham.hcm.edu.vn'),
    ('BTX', 'https://thptbuithixuan.hcm.edu.vn'),
    ('TKN', 'https://thpttrankhainguyen.hcm.edu.vn'),
    ('BINH_PHU', 'https://thptbinhphu.hcm.edu.vn'),
    ('LTT_Q6', 'https://thptlethanhton.hcm.edu.vn')
)
UPDATE "G10HCM_SCHOOL" s
SET website = updates.website
FROM updates
WHERE s.code = updates.code
  AND (
    s.website IS NULL
    OR btrim(s.website) = ''
    OR s.website ~* '(haam|ches|truongabc|nguyenhue|nguyenvancu|haisihighschool|amu|thptabc)'
  );
