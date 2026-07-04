const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../apps/frontend/src/index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const themeCss = `
/* Cute Light Theme Overrides (Default) */
.light-theme {
  background-color: #faf5ff !important; /* Soft cream-lavender background */
  background-image: radial-gradient(#e9d5ff 1.5px, transparent 1.5px) !important; /* Cute dot pattern */
  background-size: 20px 20px !important;
  color: #334155 !important;
}

.light-theme .bg-slate-900 {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-color: #f3e8ff !important;
  box-shadow: 0 10px 25px -5px rgba(167, 139, 250, 0.08) !important;
  color: #1e1b4b !important;
}

.light-theme .bg-slate-900\\/60 {
  background-color: rgba(255, 255, 255, 0.85) !important;
  border-color: #f3e8ff !important;
  box-shadow: 0 10px 25px -5px rgba(167, 139, 250, 0.08) !important;
  color: #1e1b4b !important;
}

.light-theme .bg-slate-900\\/50 {
  background-color: rgba(255, 255, 255, 0.85) !important;
  border-color: #f3e8ff !important;
  color: #1e1b4b !important;
}

.light-theme .bg-slate-950 {
  background-color: #ffffff !important;
  border-color: #e9d5ff !important;
  color: #1e1b4b !important;
}

.light-theme .bg-slate-950\\/40 {
  background-color: #ffffff !important;
  border-color: #e9d5ff !important;
  color: #1e1b4b !important;
}

.light-theme .bg-slate-950\\/45 {
  background-color: #fbf7f9 !important;
  border-color: #fae8ff !important;
  color: #1e1b4b !important;
}

.light-theme .border-slate-800 {
  border-color: #f3e8ff !important;
}

.light-theme .border-slate-800\\/80 {
  border-color: #f3e8ff !important;
}

.light-theme .text-slate-450 {
  color: #6b7280 !important;
}

.light-theme .text-slate-400 {
  color: #4b5563 !important;
}

.light-theme .text-slate-500 {
  color: #6b7280 !important;
}

.light-theme .text-white {
  color: #1e1b4b !important;
}

.light-theme .text-slate-200 {
  color: #1e1b4b !important;
}

.light-theme .text-slate-300 {
  color: #312e81 !important;
}

.light-theme .text-slate-350 {
  color: #312e81 !important;
}

.light-theme h2, .light-theme h3, .light-theme h4 {
  color: #1e1b4b !important;
}

.light-theme .bg-indigo-950\\/20 {
  background-color: #eef2ff !important;
  border-color: #c7d2fe !important;
}

.light-theme .bg-indigo-950\\/25 {
  background-color: #eef2ff !important;
  border-color: #c7d2fe !important;
}

.light-theme .text-indigo-400 {
  color: #4f46e5 !important;
}

.light-theme .bg-slate-850 {
  background-color: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #1e1b4b !important;
}

.light-theme nav.bg-slate-900 {
  background-color: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid #f3e8ff !important;
  box-shadow: 0 4px 6px -1px rgba(167, 139, 250, 0.03) !important;
}

.light-theme select {
  background-color: #ffffff !important;
  color: #1e1b4b !important;
  border-color: #e9d5ff !important;
}

.light-theme input {
  background-color: #ffffff !important;
  color: #1e1b4b !important;
  border-color: #e9d5ff !important;
}

.light-theme table th {
  background-color: #f5f3ff !important;
  color: #5b21b6 !important;
  border-color: #e9d5ff !important;
}

.light-theme table td {
  border-color: #f3e8ff !important;
  color: #312e81 !important;
}

.light-theme .hover\\:bg-slate-850\\/10:hover {
  background-color: rgba(245, 243, 255, 0.5) !important;
}

.light-theme .text-slate-100 {
  color: #1e1b4b !important;
}
`;

if (!cssContent.includes('.light-theme')) {
  cssContent += themeCss;
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('Appended light-theme overrides to index.css');
}
