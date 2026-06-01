import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Mannam Ganesh Babu\\.gemini\\antigravity-ide\\brain\\92b4b7de-60df-42cd-b23b-41fa6ae96cdb';
const destDir = 'd:\\eduspace\\eduspace\\public';

const files = [
  { src: 'gladiator_rising_1780037185260.png', dest: 'gladiator_rising.png' },
  { src: 'arena_master_1780037208622.png', dest: 'arena_master.png' },
  { src: 'streak_overlord_1780037227067.png', dest: 'streak_overlord.png' },
  { src: 'duel_champion_1780037246621.png', dest: 'duel_champion.png' },
  { src: 'top_challenger_1780037273325.png', dest: 'top_challenger.png' },
  { src: 'rank_climber_1780037313019.png', dest: 'rank_climber.png' },
  { src: 'unbeaten_legend_1780039899777.png', dest: 'unbeaten_legend.png' },
  { src: 'elite_competitor_1780039920804.png', dest: 'elite_competitor.png' },
  { src: 'duel_veteran_1780039944799.png', dest: 'duel_veteran.png' },
  { src: 'fast_challenger_1780039967114.png', dest: 'fast_challenger.png' },
  { src: 'grand_master_duelist_1780039987515.png', dest: 'grand_master_duelist.png' }
];

console.log('Starting badge copy process...');

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

console.log(`Badge copy complete! Successfully copied ${successCount} of ${files.length} badges.`);
