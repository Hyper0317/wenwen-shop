'use strict';

var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var test = require('node:test');
var vm = require('node:vm');
var writes = require('../js/cloud-write.js');

var root = path.resolve(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('write mode defaults to RPC and allows an immediate legacy rollback', function() {
  assert.equal(writes.resolveMode({}), 'RPC_WRITE');
  assert.equal(writes.resolveMode({ stored: 'legacy_write' }), 'LEGACY_WRITE');
  assert.equal(writes.resolveMode({ search: '?a=1&write_mode=LEGACY_WRITE' }), 'LEGACY_WRITE');
  assert.equal(
    writes.resolveMode({ explicit: 'LEGACY_WRITE', search: '?write_mode=RPC_WRITE' }),
    'LEGACY_WRITE'
  );
  assert.equal(writes.resolveMode({ search: '?write_mode=unknown' }), 'RPC_WRITE');
});

test('single sale result requires a matching fixed sale ID and valid stock', function() {
  var result = writes.validateSingleSaleResult({ sale: { id: 'S1' }, stock: 4 }, 'S1');
  assert.equal(result.stock, 4);
  assert.throws(function() {
    writes.validateSingleSaleResult({ sale: { id: 'S2' }, stock: 4 }, 'S1');
  }, /销售 ID 不一致/);
  assert.throws(function() {
    writes.validateSingleSaleResult({ sale: { id: 'S1' }, stock: '4' }, 'S1');
  }, /库存无效/);
});

test('batch sale result requires every represented sale and an authoritative stock map', function() {
  var valid = { sales: [{ id: 'B1' }, { id: 'B2' }], stocks: { P1: 3, P2: 2 } };
  assert.equal(writes.validateBatchSaleResult(valid, 2), valid);
  assert.throws(function() {
    writes.validateBatchSaleResult({ sales: [{ id: 'B1' }], stocks: {} }, 2);
  }, /条数不一致/);
  assert.throws(function() {
    writes.validateBatchSaleResult({ sales: [{ id: 'B1' }] }, 1);
  }, /库存映射/);
});

test('refund result requires both fixed refund and original sale identities', function() {
  var valid = {
    refundSale: { id: 'R1' },
    originalSale: { id: 'S1' },
    stock: 5
  };
  assert.equal(writes.validateRefundResult(valid, 'R1', 'S1'), valid);
  assert.throws(function() {
    writes.validateRefundResult({ refundSale: { id: 'R2' }, originalSale: { id: 'S1' } }, 'R1', 'S1');
  }, /销售 ID 不一致/);
});

test('strict single-row writes reject zero and multi-row representations', function() {
  assert.deepEqual(writes.validateSingleRepresentation([{ id: 1 }], 'PATCH'), { id: 1 });
  assert.throws(function() { writes.validateSingleRepresentation([], 'PATCH'); }, /恰好一条/);
  assert.throws(function() { writes.validateSingleRepresentation([{ id: 1 }, { id: 2 }], 'PATCH'); }, /恰好一条/);
});

test('page uses RPC for transactional routes and strict representation for single-row writes', function() {
  assert.match(html, /<script src="\.\/js\/cloud-write\.js\?v=8\.4"><\/script>/);
  assert.match(html, /sbRpc\('wenwen_app_sale_v1'/);
  assert.match(html, /sbRpc\('wenwen_app_batch_sale_v1'/);
  assert.match(html, /sbRpc\('wenwen_app_refund_v1'/);
  assert.match(html, /validateSingleRepresentation\(result, 'PATCH ' \+ table/);
  assert.match(html, /window\.setWenwenWriteMode = setCloudWriteMode/);
  assert.match(html, /target\.searchParams\.set\('write_mode', normalized\)/);
  assert.match(html, /window\.APP_VERSION = 'v8\.4'/);
});

test('inline page script parses as JavaScript', function() {
  var scripts = [];
  var pattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  var match;
  while ((match = pattern.exec(html))) {
    if (match[1].trim()) scripts.push(match[1]);
  }
  assert.ok(scripts.length > 0);
  scripts.forEach(function(source, index) {
    new vm.Script(source, { filename: 'index-inline-' + index + '.js' });
  });
});
