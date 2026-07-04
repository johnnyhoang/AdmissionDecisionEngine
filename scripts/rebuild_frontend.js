const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const scripts = [
  'patch_search.js',
  'patch_frontend_merge.js',
  'patch_frontend_modal.js',
  'patch_frontend_year.js',
  'patch_frontend_edit.js',
  'patch_frontend_verified.js',
  'patch_compare_drawer.js',
  'patch_dashboard_refactor.js',
  'patch_frontend_distance.js',
  'patch_frontend_rec_upgrades.js',
  'patch_frontend_combo.js',
  'patch_frontend_combo_with_filters.js',
  'patch_frontend_ssf_and_placeholders.js',
  'patch_frontend_simplify.js'
];

// First, reset Grade10Container.tsx to ensure we apply from a clean baseline
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
try {
  execSync('git checkout apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx', { cwd: path.join(__dirname, '..') });
  console.log('Reset Grade10Container.tsx to committed baseline');
} catch (e) {
  console.error('Failed to reset Grade10Container.tsx', e);
}

// Run each patch script sequentially
for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`Running ${script}...`);
    try {
      execSync(`node ${script}`, { cwd: __dirname });
      console.log(`Finished ${script}`);
    } catch (err) {
      console.error(`Error running ${script}:`, err.message);
    }
  } else {
    console.warn(`Script ${script} does not exist!`);
  }
}

// Finally run the clean up script to resolve any remaining TS errors and compile warnings
console.log('Running clean_up_grade10.js...');
execSync('node clean_up_grade10.js', { cwd: __dirname });

console.log('Running patch_cute_theme.js...');
execSync('node patch_cute_theme.js', { cwd: __dirname });

console.log('Running patch_theme_css.js...');
execSync('node patch_theme_css.js', { cwd: __dirname });

console.log('Rebuild completed successfully.');
