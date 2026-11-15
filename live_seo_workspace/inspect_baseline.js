const fs = require('fs');
const path = require('path');

const pages = [
  { file: 'index.html', route: '/' },
  { file: 'youtube-tools.html', route: '/youtube-tools' },
  { file: 'sponsorship.html', route: '/sponsorship' },
  { file: 'tax.html', route: '/tax' },
  { file: 'growth.html', route: '/growth' },
  { file: 'analytics.html', route: '/analytics' },
  { file: 'academy.html', route: '/academy' },
  { file: 'benchmarks.html', route: '/benchmarks' }
];

function extractBetween(str, startToken, endToken) {
  const s = str.indexOf(startToken);
  if (s === -1) return '';
  const e = str.indexOf(endToken, s + startToken.length);
  if (e === -1) return '';
  return str.substring(s + startToken.length, e).trim();
}

const baseline = [];

pages.forEach(({ file, route }) => {
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');

  // Title
  const title = extractBetween(html, '<title>', '</title>');

  // Meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const description = descMatch ? descMatch[1] : '';

  // Meta keywords
  const kwMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/i);
  const keywords = kwMatch ? kwMatch[1].split(',').map(k => k.trim()) : [];

  // Canonical
  const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const canonical = canonMatch ? canonMatch[1] : '';

  // Headings
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());

  // Clean text and word count
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Schema types
  const schemaMatches = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  let schemas = [];
  schemaMatches.forEach(m => {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed['@graph']) {
        schemas.push(...parsed['@graph'].map(g => g['@type']));
      } else if (parsed['@type']) {
        schemas.push(parsed['@type']);
      }
    } catch(e) {}
  });

  baseline.push({
    file,
    route,
    canonical,
    title: { text: title, length: title.length },
    description: { text: description, length: description.length },
    keywordsCount: keywords.length,
    topKeywords: keywords.slice(0, 8),
    h1: h1Matches,
    h2Count: h2Matches.length,
    h2List: h2Matches.slice(0, 10),
    h3Count: h3Matches.length,
    wordCount,
    schemas
  });
});

fs.writeFileSync('live_seo_workspace/01_our_baseline.json', JSON.stringify(baseline, null, 2), 'utf8');
console.log('Baseline generated for ' + baseline.length + ' pages');
