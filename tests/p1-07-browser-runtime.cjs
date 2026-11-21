'use strict';

/*
 * Runs the real page through Chromium without contacting production Supabase.
 * The generated data bundle is intentionally absent from source control, so
 * this harness supplies an empty bundle while serving repository assets.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const puppeteerPath = process.env.PUPPETEER_CORE_PATH;
const browserPath = process.env.BROWSER_PATH;

if (!puppeteerPath || !browserPath) {
  throw new Error('Set PUPPETEER_CORE_PATH and BROWSER_PATH before running this test.');
}

const puppeteer = require(puppeteerPath);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function createServer() {
  return http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (requestPath === '/雯雯的小店.data.js') {
      response.writeHead(200, { 'Content-Type': contentTypes['.js'] });
      response.end('window.__WENWEN_DATA_STUB__ = true;\n');
      return;
    }

    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const resolved = path.resolve(repoRoot, relativePath);
    if (!resolved.startsWith(repoRoot + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[path.extname(resolved).toLowerCase()] || 'application/octet-stream'
    });
    fs.createReadStream(resolved).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const server = createServer();
  const port = await listen(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--disable-background-networking', '--disable-component-update', '--no-first-run']
  });

  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error)));

    await page.evaluateOnNewDocument(() => {
      window.__xhrCalls = [];
      class StubXHR {
        constructor() {
          this.readyState = 0;
          this.status = 0;
          this.responseText = '';
          this.timeout = 0;
        }
        open(method, url) {
          this.method = method;
          this.url = url;
        }
        setRequestHeader(key, value) {
          this.headers = this.headers || {};
          this.headers[key] = value;
        }
        send(body) {
          window.__xhrCalls.push({ method: this.method, url: this.url, body: body || null });
          if (this.url.includes('/rest/v1/rpc/') && window.__xhrRetryOnce) {
            window.__xhrRetryOnce = false;
            this.readyState = 4;
            this.status = 0;
            if (this.onerror) this.onerror();
            return;
          }
          if (this.url.includes('/rest/v1/rpc/') && window.__xhrConflictOnce) {
            window.__xhrConflictOnce = false;
            this.readyState = 4;
            this.status = 409;
            this.responseText = JSON.stringify({ code: '23505', message: '同一 ID 已被不同内容使用，请人工核查' });
            if (this.onreadystatechange) this.onreadystatechange();
            return;
          }
          this.readyState = 4;
          this.status = 200;
          this.responseText = this.method === 'GET'
            ? '[]'
            : JSON.stringify({ sale: { id: 'SERVER_REPLACES_ME' }, stock: 1 });
          if (this.onreadystatechange) this.onreadystatechange();
        }
      }
      window.XMLHttpRequest = StubXHR;
    });

    await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    const defaultState = await page.evaluate(() => ({
      mode: window.CLOUD_WRITE_MODE,
      apiLoaded: typeof window.WenwenCloudWrites === 'object',
      rpcAvailable: typeof window.sbRpc === 'function',
      editorAvailable: typeof window.setWenwenWriteMode === 'function'
    }));
    assert.deepEqual(defaultState, {
      mode: 'RPC_WRITE',
      apiLoaded: true,
      rpcAvailable: true,
      editorAvailable: true
    });

    await page.goto(`${origin}/index.html?write_mode=LEGACY_WRITE`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => window.CLOUD_WRITE_MODE), 'LEGACY_WRITE');
    assert.equal(await page.evaluate(() => localStorage.getItem('wenwen_write_mode')), 'LEGACY_WRITE');

    await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => window.CLOUD_WRITE_MODE), 'LEGACY_WRITE');

    await page.goto(`${origin}/index.html?write_mode=RPC_WRITE`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => window.CLOUD_WRITE_MODE), 'RPC_WRITE');
    assert.equal(await page.evaluate(() => localStorage.getItem('wenwen_write_mode')), 'RPC_WRITE');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.evaluate(() => window.setWenwenWriteMode('LEGACY_WRITE'))
    ]);
    assert.equal(await page.evaluate(() => window.CLOUD_WRITE_MODE), 'LEGACY_WRITE');
    assert.equal(await page.evaluate(() => localStorage.getItem('wenwen_write_mode')), 'LEGACY_WRITE');

    assert.equal(await page.evaluate(() => {
      try {
        window.setWenwenWriteMode('INVALID');
        return false;
      } catch (error) {
        return true;
      }
    }), true);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.evaluate(() => window.setWenwenWriteMode('RPC_WRITE'))
    ]);

    const rpcRequest = await page.evaluate(async () => {
      await window.sbRpc('wenwen_app_sale_v1', { p_sale_id: 'S-RUNTIME' }, '/rest/v1/sales?select=*&id=eq.S-RUNTIME&limit=1');
      return window.__xhrCalls[window.__xhrCalls.length - 1];
    });
    assert.equal(rpcRequest.method, 'POST');
    assert.match(rpcRequest.url, /\/rest\/v1\/rpc\/wenwen_app_sale_v1$/);
    assert.deepEqual(JSON.parse(rpcRequest.body), { p_sale_id: 'S-RUNTIME' });

    const retryRequests = await page.evaluate(async () => {
      const start = window.__xhrCalls.length;
      window.__xhrRetryOnce = true;
      await window.sbRpc(
        'wenwen_app_sale_v1',
        { p_sale_id: 'S-RETRY', p_product_id: 'P1', p_quantity: 1, p_unit_price: 1 },
        '/rest/v1/sales?select=*&id=eq.S-RETRY&limit=1'
      );
      return window.__xhrCalls.slice(start);
    });
    assert.equal(retryRequests.length, 3);
    assert.equal(retryRequests[0].method, 'POST');
    assert.equal(retryRequests[1].method, 'GET');
    assert.match(retryRequests[1].url, /\/rest\/v1\/sales\?/);
    assert.equal(retryRequests[2].method, 'POST');
    assert.equal(retryRequests[0].url, retryRequests[2].url);
    assert.equal(retryRequests[0].body, retryRequests[2].body);
    assert.match(retryRequests[0].body, /"p_sale_id":"S-RETRY"/);

    const conflictResult = await page.evaluate(async () => {
      const start = window.__xhrCalls.length;
      window.__xhrConflictOnce = true;
      try {
        await window.sbRpc(
          'wenwen_app_sale_v1',
          { p_sale_id: 'S-CONFLICT', p_product_id: 'P1', p_quantity: 1, p_unit_price: 1 },
          '/rest/v1/sales?select=*&id=eq.S-CONFLICT&limit=1'
        );
        return { error: '', calls: window.__xhrCalls.slice(start) };
      } catch (error) {
        return { error: String(error && error.message || error), calls: window.__xhrCalls.slice(start) };
      }
    });
    assert.match(conflictResult.error, /写入冲突，请人工核查，禁止自动重试/);
    assert.equal(conflictResult.calls.length, 1);
    assert.equal(conflictResult.calls[0].method, 'POST');

    assert.deepEqual(pageErrors, []);
    console.log('P1-07 browser runtime: 10/10 passed');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
