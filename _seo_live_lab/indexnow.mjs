import { readFile } from 'node:fs/promises';

const origin = 'https://www.twcreatorcalc.xyz';
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(https:\/\/www\.twcreatorcalc\.xyz\/[^<]*)<\/loc>/g)].map((match) => match[1]);
if (!urls.length || urls.length > 10000) throw new Error('Expected 1–10,000 canonical sitemap URLs.');

const submit = process.argv.includes('--submit');
const requestedUrls = process.argv.slice(2).filter((argument) => argument !== '--submit');
const urlList = requestedUrls.length ? [...new Set(requestedUrls)] : urls;
if (urlList.some((url) => !urls.includes(url))) throw new Error('Each URL must appear in the canonical sitemap.');

if (!submit) {
  console.log(urlList.join('\n'));
} else {
  const key = process.env.TWCREATORCALC_INDEXNOW_KEY;
  if (!/^[a-zA-Z\d-]{8,128}$/.test(key ?? '')) {
    throw new Error('Set TWCREATORCALC_INDEXNOW_KEY to the key published on the canonical host.');
  }
  const keyLocation = origin + '/' + key + '.txt';
  const liveKey = await fetch(keyLocation, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!liveKey.ok || (await liveKey.text()).trim() !== key) {
    throw new Error('Publish the IndexNow key file on the canonical host before submitting.');
  }
  for (const url of urlList) {
    const page = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (!page.ok || page.headers.get('x-robots-tag')?.includes('noindex')) {
      throw new Error('Canonical URL is not ready for submission: ' + url);
    }
    const html = await page.text();
    if (!html.includes('<link rel="canonical" href="' + url + '">')) {
      throw new Error('Live canonical does not match the sitemap: ' + url);
    }
  }
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('IndexNow returned HTTP ' + response.status);
  console.log('IndexNow accepted the request (HTTP ' + response.status + ').');
}
