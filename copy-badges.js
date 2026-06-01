import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Mannam Ganesh Babu\\.gemini\\antigravity-ide\\brain\\b18a15a4-247d-46ce-b307-1774c9a2e9f9';
const destDir = 'd:\\eduspace\\eduspace\\public';

const files = [
  { src: 'streak_novice_1780301353319.png', dest: 'streak_novice.png' },
  { src: 'streak_learner_1780301458269.png', dest: 'streak_learner.png' },
  { src: 'streak_scholar_1780301783391.png', dest: 'streak_scholar.png' },
  { src: 'streak_prodigy_1780301802578.png', dest: 'streak_prodigy.png' },
  { src: 'streak_warrior_1780301822409.png', dest: 'streak_warrior.png' },
  { src: 'streak_elite_1780301840127.png', dest: 'streak_elite.png' },
  { src: 'streak_master_1780301861417.png', dest: 'streak_master.png' },
  { src: 'streak_grandmaster_1780301889067.png', dest: 'streak_grandmaster.png' },
  { src: 'streak_titan_1780301910360.png', dest: 'streak_titan.png' },
  { src: 'streak_immortal_1780301933198.png', dest: 'streak_immortal.png' }
];

console.log('Starting Streak Achievement badge copy process...');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let successCount = 0;

files.forEach(f => {
  const srcPath = path.join(srcDir, f.src);
  const destPath = path.join(destDir, f.dest);
  try {
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Successfully copied ${f.src} -> ${f.dest}`);
      successCount++;
    } else {
      console.error(`Source file does not exist: ${srcPath}`);
    }
  } catch (err) {
    console.error(`Failed to copy ${f.src}:`, err.message);
  }
});

console.log(`Streak Achievement badge copy complete! Successfully copied ${successCount} of ${files.length} badges.`);
