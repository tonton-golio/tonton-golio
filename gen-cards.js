const fs = require('fs');
const path = require('path');

// language -> accent dot color (the one touch of color on an otherwise mono card)
const LANG = {
  'TypeScript': '#3178c6',
  'Jupyter Notebook': '#da5b0b',
  'Swift': '#f05138',
  'Python': '#3572a5',
};

// featured repos (verified public, accurate stars/langs)
const repos = [
  { name: 'robin',                           lang: 'TypeScript',      stars: 3 },
  { name: 'computational_physics',           lang: 'TypeScript',      stars: 9 },
  { name: 'motion-synthesis',                lang: 'Jupyter Notebook',stars: 2 },
  { name: 'inertial_navigation_transformer', lang: 'Jupyter Notebook',stars: 6 },
  { name: 'meeting-recorder',                lang: 'Swift',           stars: 0 },
  { name: 'MelanomaDelineation',             lang: 'Python',          stars: 1 },
];

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function card({ name, lang, stars }) {
  const W = 440, H = 130;
  const dot = LANG[lang] || '#888888';
  // shrink the title if the repo name is long so it never overflows
  const fs1 = name.length > 24 ? 19 : name.length > 18 ? 21 : 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)}">
  <defs>
    <pattern id="d" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.4" cy="1.4" r="1.4" fill="#ffffff" opacity="0.04"/>
    </pattern>
  </defs>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="14" fill="#0d0d0d" stroke="#ffffff" stroke-opacity="0.08"/>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="14" fill="url(#d)"/>
  <!-- faint orbit motif, top-right -->
  <g transform="translate(${W-30} 30)" fill="none" stroke="#ffffff">
    <circle r="34" stroke-opacity="0.07"/>
    <circle r="58" stroke-opacity="0.05"/>
    <circle cx="34" cy="0" r="2" fill="#ffffff" fill-opacity="0.5" stroke="none"/>
  </g>
  <g font-family="'Helvetica Neue', Helvetica, Arial, sans-serif">
    <text x="26" y="50" font-size="${fs1}" font-weight="700" letter-spacing="0.3" fill="#fafafa">${esc(name)}</text>
    <line x1="27" y1="68" x2="120" y2="68" stroke="#ffffff" stroke-opacity="0.18"/>
    <!-- language -->
    <circle cx="32" cy="100" r="5.5" fill="${dot}"/>
    <text x="46" y="105" font-size="15" font-weight="400" fill="#b8b8b8">${esc(lang)}</text>
    <!-- stars -->
    <text x="${W-26}" y="105" font-size="15" font-weight="500" fill="#9a9a9a" text-anchor="end">&#9733; ${stars}</text>
  </g>
</svg>
`;
}

const outDir = path.join(__dirname, 'cards');
fs.mkdirSync(outDir, { recursive: true });
for (const r of repos) {
  fs.writeFileSync(path.join(outDir, `${r.name}.svg`), card(r));
  console.log('wrote cards/' + r.name + '.svg');
}
