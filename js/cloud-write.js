(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WenwenCloudWrites = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var RPC_WRITE = 'RPC_WRITE';
  var LEGACY_WRITE = 'LEGACY_WRITE';
  var DEFAULT_MODE = RPC_WRITE;
  var MODE_STORAGE_KEY = 'wenwen_write_mode';

  function normalizeMode(value) {
    var mode = String(value || '').trim().toUpperCase();
    return mode === RPC_WRITE || mode === LEGACY_WRITE ? mode : '';
  }

  function readQueryMode(search) {
    var query = String(search || '').replace(/^\?/, '');
    if (!query) return '';
    var parts = query.split('&');
    for (var i = 0; i < parts.length; i += 1) {
      var pair = parts[i].split('=');
      var key = '';
      try {
        key = decodeURIComponent(pair[0] || '');
      } catch (e) {
        key = pair[0] || '';
      }
      if (key !== 'write_mode') continue;
      var value = '';
      try {
        value = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
      } catch (e2) {
        value = pair[1] || '';
      }
      return normalizeMode(value);
    }
    return '';
  }

  function resolveMode(options) {
    options = options || {};
    return normalizeMode(options.explicit)
      || readQueryMode(options.search)
      || normalizeMode(options.stored)
      || DEFAULT_MODE;
  }

  function isRpcMode(mode) {
    return normalizeMode(mode) === RPC_WRITE;
  }

  function isConflictError(value) {
    var message = String(value && value.message || value || '');
    return message.indexOf('failed: 409') >= 0
      || message.indexOf('"code":"23505"') >= 0
      || message.indexOf('已被不同内容使用') >= 0
      || message.indexOf('人工核查') >= 0;
  }

  function formatWriteError(value) {
    if (isConflictError(value)) {
      return '写入冲突，请人工核查，禁止自动重试';
    }
    return String(value && value.message || value || '未知错误');
  }

  function asObject(value, context) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(context + ' 必须返回 JSON 对象');
    }
    return value;
  }

  function requireSale(value, expectedId, context) {
    var sale = asObject(value, context);
    if (!sale.id || (expectedId && sale.id !== expectedId)) {
      throw new Error(context + ' 返回的销售 ID 不一致');
    }
    return sale;
  }

  function validateSingleSaleResult(result, expectedSaleId) {
    var value = asObject(result, '单商品销售 RPC');
    requireSale(value.sale, expectedSaleId, '单商品销售 RPC');
    if (value.stock !== null && value.stock !== undefined && typeof value.stock !== 'number') {
      throw new Error('单商品销售 RPC 返回的库存无效');
    }
    return value;
  }

  function validateBatchSaleResult(result, expectedLineCount) {
    var value = asObject(result, '批量销售 RPC');
    if (!Array.isArray(value.sales) || value.sales.length !== expectedLineCount) {
      throw new Error('批量销售 RPC 返回的销售条数不一致');
    }
    value.sales.forEach(function(sale) {
      requireSale(sale, '', '批量销售 RPC');
    });
    if (!value.stocks || typeof value.stocks !== 'object' || Array.isArray(value.stocks)) {
      throw new Error('批量销售 RPC 未返回库存映射');
    }
    return value;
  }

  function validateRefundResult(result, expectedRefundId, expectedOriginalSaleId) {
    var value = asObject(result, '退货 RPC');
    requireSale(value.refundSale, expectedRefundId, '退货 RPC');
    requireSale(value.originalSale, expectedOriginalSaleId, '退货 RPC');
    if (value.stock !== null && value.stock !== undefined && typeof value.stock !== 'number') {
      throw new Error('退货 RPC 返回的库存无效');
    }
    return value;
  }

  function validateSingleRepresentation(result, context) {
    if (!Array.isArray(result) || result.length !== 1
        || !result[0] || typeof result[0] !== 'object' || Array.isArray(result[0])) {
      throw new Error(context + ' 必须返回恰好一条权威记录');
    }
    return result[0];
  }

  return Object.freeze({
    RPC_WRITE: RPC_WRITE,
    LEGACY_WRITE: LEGACY_WRITE,
    DEFAULT_MODE: DEFAULT_MODE,
    MODE_STORAGE_KEY: MODE_STORAGE_KEY,
    normalizeMode: normalizeMode,
    readQueryMode: readQueryMode,
    resolveMode: resolveMode,
    isRpcMode: isRpcMode,
    isConflictError: isConflictError,
    formatWriteError: formatWriteError,
    validateSingleSaleResult: validateSingleSaleResult,
    validateBatchSaleResult: validateBatchSaleResult,
    validateRefundResult: validateRefundResult,
    validateSingleRepresentation: validateSingleRepresentation
  });
});
