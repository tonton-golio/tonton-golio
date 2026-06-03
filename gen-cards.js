const fs = require('fs');
const path = require('path');

// language -> accent dot color (the one touch of color on an otherwise mono card)
const LANG = {
  'TypeScript': '#3178c6',
  'Jupyter Notebook': '#da5b0b',
  'Swift': '#f05138',
  'Python': '#3572a5',
};

// featured repos shown on the profile. Star counts are fetched live from the
// GitHub API at generation time (see fetchStars); the `stars` field here is a
// fallback used only if the API call fails. `lang` likewise falls back when the
// API has no detected language. `tag` adds a small status pill (top-right) for
// unfinished repos; omit for active ones.
const OWNER = process.env.CARDS_OWNER || 'tonton-golio';
const repos = [
  { name: 'robin',                 lang: 'TypeScript',       stars: 6 },
  { name: 'computational_physics', lang: 'TypeScript',       stars: 8 },
  { name: 'motion-synthesis',      lang: 'Jupyter Notebook', stars: 1, tag: 'EXPERIMENT' },
  { name: 'mbl-intrinsicDim',      lang: 'Jupyter Notebook', stars: 0, tag: 'BACHELOR · 2021' },
];

// Pull live star counts (and language) from the GitHub API. Uses GITHUB_TOKEN
// when present (CI) to lift the unauthenticated rate limit. Falls back to the
// hardcoded values above on any failure so a card is never left blank/broken.
async function fetchStars(repo) {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'gen-cards' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo.name}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      ...repo,
      stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : repo.stars,
      lang: data.language || repo.lang,
    };
  } catch (err) {
    console.warn(`! ${repo.name}: live fetch failed (${err.message}); using fallback stars=${repo.stars}`);
    return repo;
  }
}

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function card({ name, lang, stars, tag }) {
  const W = 440, H = 130;
  const dot = LANG[lang] || '#888888';
  // shrink the title if the repo name is long so it never overflows
  const fs1 = name.length > 24 ? 19 : name.length > 18 ? 21 : 24;
  // motif: faint orbit rings top-right; for tagged repos, a status pill on the
  // bottom row (left of the stars) so it never collides with a long repo name.
  let motif;
  if (tag) {
    const pillW = Math.round(tag.length * 7.2 + 20);
    const pillX = (W - 78) - pillW; // right edge held clear of the star count
    motif = `<g font-family="'Helvetica Neue', Helvetica, Arial, sans-serif">
    <rect x="${pillX}" y="89" width="${pillW}" height="22" rx="11" fill="#ffffff" fill-opacity="0.03" stroke="#ffffff" stroke-opacity="0.22"/>
    <text x="${pillX + pillW/2}" y="104" font-size="10.5" font-weight="600" letter-spacing="1.2" fill="#9a9a9a" text-anchor="middle">${esc(tag)}</text>
  </g>`;
  } else {
    motif = `<g transform="translate(${W-30} 30)" fill="none" stroke="#ffffff">
    <circle r="34" stroke-opacity="0.07"/>
    <circle r="58" stroke-opacity="0.05"/>
    <circle cx="34" cy="0" r="2" fill="#ffffff" fill-opacity="0.5" stroke="none"/>
  </g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)}">
  <defs>
    <pattern id="d" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.4" cy="1.4" r="1.4" fill="#ffffff" opacity="0.04"/>
    </pattern>
  </defs>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="14" fill="#0d0d0d" stroke="#ffffff" stroke-opacity="0.08"/>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="14" fill="url(#d)"/>
  <!-- top-right motif (orbit rings, or a status pill for unfinished repos) -->
  ${motif}
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

async function main() {
  const outDir = path.join(__dirname, 'cards');
  fs.mkdirSync(outDir, { recursive: true });
  const resolved = await Promise.all(repos.map(fetchStars));
  for (const r of resolved) {
    fs.writeFileSync(path.join(outDir, `${r.name}.svg`), card(r));
    console.log(`wrote cards/${r.name}.svg  (★ ${r.stars}, ${r.lang})`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
