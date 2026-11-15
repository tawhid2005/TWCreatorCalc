const fs = require('fs');
const path = require('path');

const PAGES = [
  'index.html',
  'youtube-tools.html',
  'sponsorship.html',
  'tax.html',
  'growth.html',
  'analytics.html',
  'academy.html',
  'benchmarks.html'
];

console.log('=== RUNNING RIGOROUS LIVE SEO AUDIT & BENCHMARK VERIFICATION ===\n');

let allPassed = true;
const auditResults = [];

for (const file of PAGES) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File missing: ${file}`);
    allPassed = false;
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');

  // 1. Title verification
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const titleLen = title.length;
  const titleOk = titleLen >= 45 && titleLen <= 65;

  // 2. Meta description verification (robust against internal single quotes)
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+name=["']description["']\s+content='([^']+)'/i);
  const desc = descMatch ? descMatch[1].trim() : '';
  const descLen = desc.length;
  const descOk = descLen >= 120 && descLen <= 165;

  // 3. Strict single H1 verification
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Ok = h1Count === 1;

  // 4. JSON-LD Schema Validation
  const schemaMatches = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi) || [];
  let schemasValid = true;
  let schemaCount = 0;
  let schemaTypes = [];

  for (const sTag of schemaMatches) {
    const rawJson = sTag.replace(/<script\s+type=["']application\/ld\+json["']>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(rawJson);
      schemaCount++;
      if (parsed['@graph']) {
        parsed['@graph'].forEach(item => schemaTypes.push(item['@type']));
      } else if (parsed['@type']) {
        schemaTypes.push(parsed['@type']);
      }
    } catch (e) {
      schemasValid = false;
      console.error(`[FAIL] JSON-LD Parse Error in ${file}:`, e.message);
    }
  }

  // 5. Total Word Count
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = textContent.split(/\s+/).length;

  // 6. Canonical check
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonicalOk = !!canonicalMatch && canonicalMatch[1].startsWith('https://twcreatorcalc.xyz');

  // Check against competitor average (~1,450 words)
  const compAvgWords = 1450;
  const beatsCompetitor = wordCount > compAvgWords;

  const pageStatus = titleOk && descOk && h1Ok && schemasValid && canonicalOk;
  if (!pageStatus) allPassed = false;

  const resultObj = {
    file,
    title,
    titleLen,
    titleOk,
    desc,
    descLen,
    descOk,
    h1Count,
    h1Text: h1Matches[0] ? h1Matches[0].replace(/<[^>]+>/g, '').trim().substring(0, 60) + '...' : 'NONE',
    schemaCount,
    schemaTypes: [...new Set(schemaTypes)],
    wordCount,
    beatsCompetitor,
    canonical: canonicalMatch ? canonicalMatch[1] : 'NONE'
  };

  auditResults.push(resultObj);

  console.log(`PAGE: ${file}`);
  console.log(`  - Title (${titleLen}c): "${title}" [${titleOk ? 'PASS' : 'WARN'}]`);
  console.log(`  - Description (${descLen}c): "${desc}" [${descOk ? 'PASS' : 'WARN'}]`);
  console.log(`  - H1 Count: ${h1Count} ("${resultObj.h1Text}") [${h1Ok ? 'PASS' : 'FAIL'}]`);
  console.log(`  - JSON-LD Schemas: ${schemaCount} parsed valid (${resultObj.schemaTypes.join(', ')}) [${schemasValid ? 'PASS' : 'FAIL'}]`);
  console.log(`  - Word Count: ${wordCount} words (Competitor avg ~${compAvgWords}) [${beatsCompetitor ? 'SUPERIOR' : 'NEEDS EXPANSION'}]`);
  console.log(`  - Canonical: ${resultObj.canonical} [${canonicalOk ? 'PASS' : 'FAIL'}]\n`);
}

fs.writeFileSync(path.join(__dirname, '04_verification_report.json'), JSON.stringify(auditResults, null, 2));

console.log('====================================================');
if (allPassed) {
  console.log('✅ ALL 8 PAGES PASSED 100% OF THE TECHNICAL SEO VERIFICATION CHECKS!');
} else {
  console.error('❌ SOME CHECKS FAILED. INVESTIGATE LOG ABOVE.');
}
console.log('====================================================');
