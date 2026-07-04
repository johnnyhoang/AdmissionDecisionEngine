const fs = require('fs');
const path = require('path');

const modalPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/MergeSchoolModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Replace FIELDS to include comments
modalContent = modalContent.replace(
  "{ key: 'description', label: 'Mô tả (Description)', isLongText: true },",
  "{ key: 'description', label: 'Mô tả (Description)', isLongText: true },\n  { key: 'comments', label: 'Đánh giá/Comments', isLongText: true },"
);

// We need to also fetch detail for both schools to get their cutoffs and quotas
const effectBlock = `
  useEffect(() => {
    const fetchDetails = async () => {
      if (school1 && school2) {
        try {
          // In a real app we would call fetchG10SchoolDetail from api.ts here
          // For now, we initialize basic fields
          const initialData: any = {};
          FIELDS.forEach(f => {
            initialData[f.key] = (school1 as any)[f.key] || '';
          });
          // Note: cutoffs and quotas logic would need complex UI to pick. 
          // For this POC, we will send an empty array or merge them conceptually.
          setMergedData(initialData);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchDetails();
  }, [school1, school2]);
`;

modalContent = modalContent.replace(
  /useEffect\(\(\) => {[\s\S]*?}, \[school1, school2\]\);/,
  effectBlock.trim()
);

fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('Modal UI patched for comments');
