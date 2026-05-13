import { readFile } from 'node:fs/promises';

const files = ['index.html', 'src/main.js', 'src/styles.css', 'README.md'];
const requiredSnippets = [
  ['src/main.js', 'calendarDaysHtml'],
  ['src/main.js', 'deletePlayer'],
  ['src/main.js', 'selectedDate'],
  ['src/main.js', 'carCount'],
  ['src/styles.css', '.calendar-panel'],
  ['src/styles.css', '.top-row'],
  ['README.md', 'QAチェックリスト'],
];

const contents = new Map();
for (const file of files) {
  contents.set(file, await readFile(file, 'utf8'));
}

for (const [file, snippet] of requiredSnippets) {
  if (!contents.get(file)?.includes(snippet)) {
    throw new Error(`${file} に必要な確認文字列がありません: ${snippet}`);
  }
}

console.log('QA smoke checks passed.');
