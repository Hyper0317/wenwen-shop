// OrbIndicator — 无依赖 Canvas 刷新动效，基于 thinking-orbs 引擎（MIT, Jakub Antalik）。
// 引擎文件 vendor-orb-engine.js 暴露 window.OrbEngine（resolvePreset/MODE_FRAMES/paintFrame）。
// 用法：createOrb(canvasEl, { state:'searching', size:32, color:'#1f8fff', speed:1, dark:false })
// 返回 { setState, setSpeed, setPaused, stop }。
(function () {
  'use strict';

  function parseTint(hex) {
    if (!hex) return null;
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function createOrb(canvas, opts) {
    opts = opts || {};
    var E = window.OrbEngine;
    if (!E) { console.warn("[Orb] engine not loaded"); return null; }
    var state = opts.state || 'searching';
    var userSpeed = opts.speed == null ? 1 : opts.speed;
    var dark = !!opts.dark;
    var cssSize = opts.size || 32;
    var paused = false;
    var disposed = false;
    var raf = 0;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';

    var ctx = canvas.getContext('2d');
    var preset = E.resolvePreset(state, 64);
    var tint = parseTint(opts.color);

    function draw(tSec) {
      var frameFn = E.MODE_FRAMES[preset.mode];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssSize, cssSize);
      E.paintFrame(ctx, frameFn(cssSize, tSec, preset), dark, tint);
    }

    function loop(nowMs) {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (paused) return;
      // 与官方组件一致：performance.now()/1000 秒时间轴 × preset.speed × 用户速度
      draw((nowMs / 1000) * (preset.speed || 1) * userSpeed);
    }
    raf = requestAnimationFrame(loop);

    return {
      setState: function (s) {
        if (s === state) return;
        state = s;
        preset = E.resolvePreset(state, 64);
      },
      setSpeed: function (v) { userSpeed = v; },
      setPaused: function (p) { paused = p; },
      stop: function () { disposed = true; cancelAnimationFrame(raf); },
    };
  }

  window.createOrb = createOrb;
})();
