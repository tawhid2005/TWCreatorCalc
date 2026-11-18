import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.twcreatorcalc.xyz';
const routes = ['/', '/youtube-tools', '/sponsorship', '/tax', '/growth', '/analytics', '/academy', '/benchmarks', '/youtube-rpm-calculator'];
const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const redirect = config.redirects?.find(({ source }) => source === pathname);
  if (redirect) {
    response.writeHead(redirect.permanent ? 308 : 307, { Location: redirect.destination }).end();
    return;
  }
  if (config.cleanUrls && pathname.endsWith('.html') && routes.includes(pathname.slice(0, -5))) {
    response.writeHead(308, { Location: pathname.slice(0, -5) }).end();
    return;
  }
  const file = pathname === '/' ? 'index.html' : routes.includes(pathname) ? pathname.slice(1) + '.html' : pathname.slice(1);
  if (!/^[a-z\d.-]+$/i.test(file)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(join(root, file));
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const local = 'http://127.0.0.1:' + server.address().port;
const profile = await mkdtemp(join(tmpdir(), 'twcreatorcalc-chrome-'));
const executable = process.argv[2] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = spawn(executable, ['--headless', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const journal = { scope: 'Headless Chrome against a local HTTP server simulating clean URLs and configured redirects', pages: [], interactions: {} };
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 50 && !port; attempt++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]; }
    catch { await delay(200); }
  }
  assert.ok(port, 'Headless Chrome did not start');
  const [target] = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    pending.get(message.id)?.(message);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(method + ' timed out'));
    }, 15000);
    pending.set(requestId, ({ result, error }) => {
      clearTimeout(timer);
      pending.delete(requestId);
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.result.description ?? expression);
    return response.result.value;
  };
  async function visit(route) {
    await cdp('Page.navigate', { url: local + route });
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete'`)) return;
      } catch {}
      await delay(100);
    }
    throw new Error('Page did not load: ' + route);
  }
  const snapshot = `(() => {
    const visibleHeadings = [...document.querySelectorAll('main h1')].filter(node => node.getClientRects().length);
    const property = (name) => document.querySelector('meta[property="' + name + '"]')?.content;
    const metadata = (name) => document.querySelector('meta[name="' + name + '"]')?.content;
    return {
      title: document.title, description: metadata('description'), canonical: document.querySelector('link[rel="canonical"]')?.href,
      headings: visibleHeadings.map(node => node.textContent.trim()), schemaCount: document.querySelectorAll('script[type="application/ld+json"]').length,
      ogTitle: property('og:title'), ogDescription: property('og:description'), ogUrl: property('og:url'),
      twitterTitle: metadata('twitter:title'), twitterDescription: metadata('twitter:description')
    };
  })()`;
  for (const route of routes) {
    const response = await fetch(local + route, { redirect: 'manual' });
    assert.equal(response.status, 200, route);
    await visit(route);
    const page = await evaluate(snapshot);
    assert.equal(page.canonical, origin + route, route);
    assert.equal(page.ogUrl, page.canonical, route);
    assert.equal(page.headings.length, 1, route);
    assert.ok(page.schemaCount > 0, route);
    assert.equal(page.title, page.ogTitle, route);
    assert.equal(page.title, page.twitterTitle, route);
    assert.equal(page.description, page.ogDescription, route);
    assert.equal(page.description, page.twitterDescription, route);
    journal.pages.push({ route, status: response.status, ...page });
  }
  const redirects = { '/seo-hub': '/benchmarks', '/youtube-tools.html': '/youtube-tools', '/youtube-rpm-calculator.html': '/youtube-rpm-calculator' };
  for (const [path, destination] of Object.entries(redirects)) {
    const response = await fetch(local + path, { redirect: 'manual' });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get('location'), destination, path);
  }
  journal.interactions.redirects = redirects;
  assert.equal((await fetch(local + '/absent-route')).status, 404);
  for (const path of ['/robots.txt', '/sitemap.xml', '/og-image.png', '/twitter-image.png', '/logo.svg', '/googlee59d340a4eeb0771.html', '/BingSiteAuth.xml']) {
    assert.equal((await fetch(local + path)).status, 200, path);
  }
  const arithmetic = await evaluate(`(() => {
    function submit(kind, entries) {
      const form = document.querySelector('form[data-calculation="' + kind + '"]');
      for (const [field, value] of Object.entries(entries)) form.elements[field].value = value;
      form.requestSubmit();
      return form.querySelector('output').value;
    }
    return [
      submit('rpm', { revenue: 6, views: 100000 }),
      submit('revenue', { views: 125000, rpm: 4 }),
      submit('views', { revenue: 1, rpm: 3 }),
      submit('views', { revenue: 1, rpm: 0 }),
      submit('views', { revenue: 0, rpm: 0 })
    ];
  })()`);
  assert.deepEqual(arithmetic, ['$0.06 per 1,000 views', '$500.00 estimated revenue', '334 views needed',
    'Enter an RPM above zero to reach a positive goal.', '0 views needed']);
  journal.interactions.rpmCalculator = arithmetic;
  await visit('/');
  await evaluate("document.querySelector('#nav-youtube-tools').click()");
  const videoSuite = await evaluate(snapshot);
  assert.equal(videoSuite.canonical, origin + '/youtube-tools');
  assert.deepEqual(videoSuite.headings, ['YouTube Category Finder and Tag Extractor']);
  assert.equal(videoSuite.title, videoSuite.twitterTitle);
  assert.equal(videoSuite.schemaCount, 0);
  await evaluate("document.querySelector('#nav-home').click()");
  const home = await evaluate(snapshot);
  assert.equal(home.canonical, origin + '/');
  assert.deepEqual(home.headings, ['YouTube Money Calculator']);
  assert.equal(home.schemaCount, 1);
  journal.interactions.suiteNavigation = { videoSuite, home };
  await visit('/growth');
  const watchHours = await evaluate(`(() => {
    const slider = document.querySelector('#ypp-hours-slider');
    const badge = document.querySelector('#ypp-status-badge');
    return [3750, 4000].map(hours => {
      slider.value = hours;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      return badge.textContent;
    });
  })()`);
  assert.deepEqual(watchHours, ['Watch-hour target in progress', 'Watch-hour target reached']);
  journal.interactions.watchHourThreshold = watchHours;
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await visit('/youtube-rpm-calculator');
  const mobile = await evaluate(`({
    width: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
    formCount: document.querySelectorAll('form[data-calculation]').length
  })`);
  assert.equal(mobile.contentWidth, mobile.width, 'RPM page should fit the mobile viewport');
  assert.equal(mobile.formCount, 3);
  journal.interactions.rpmMobile = mobile;
  console.log('Verified nine rendered pages, routing, metadata, RPM calculations, the YPP boundary and RPM mobile layout.');
} catch (error) {
  journal.error = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(new URL('./05_rendered_verification.json', import.meta.url), JSON.stringify(journal, null, 2) + '\n');
  socket?.close();
  chrome.kill();
  server.close();
  await delay(400);
  if (dirname(resolve(profile)) === resolve(tmpdir()) && basename(profile).startsWith('twcreatorcalc-chrome-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}
