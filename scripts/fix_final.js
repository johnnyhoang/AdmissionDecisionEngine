const fs = require('fs');
const p = '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx';
let s = fs.readFileSync(p, 'utf8');

// Fix 1: </div\r\n -> </div>\r\n (broken closing div)
const before = s.length;
s = s.replace('</div\r\n          <button\r\n            onClick={() => setTheme', '</div>\r\n          <button\r\n            onClick={() => setTheme');

// Fix 2: remove stray > before </nav>
s = s.replace("          </button>\r\n    >\r\n      </nav>", "          </button>\r\n      </nav>");

// Also fix selectedDistricts.join -> selectedDistrict
s = s.replaceAll("selectedDistricts.join(',')", 'selectedDistrict');

// Fix unused error param in geolocation
s = s.replace(
  "      (error) => {\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');",
  "      (_err) => {\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');"
);
s = s.replace(
  "      (error) => {\r\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');",
  "      (_err) => {\r\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');"
);

fs.writeFileSync(p, s, 'utf8');
console.log('Done. Chars changed:', before !== s.length ? 'yes' : 'maybe same');
