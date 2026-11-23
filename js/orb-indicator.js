// OrbIndicator — 无依赖 Canvas 刷新动效，基于 thinking-orbs 引擎（MIT, Jakub Antalik）。
// 引擎文件 vendor-orb-engine.js 提供 resolvePreset / MODE_FRAMES / finalizeFrame / paintFrame。
// 用法：createOrb(canvasEl, { state:'searching', size:32, color:'#1f8fff', speed:1, dark:false })
// 返回 { setState, setSpeed, stop }。
(function () {
  'use strict';

  function parseTint(hex) {
    if (!hex) return null;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function createOrb(canvas, opts) {
    opts = opts || {};
    var state = opts.state || 'searching';
    var speed = opts.speed == null ? 1 : opts.speed;
    var dark = !!opts.dark;
    var tint = parseTint(opts.color);
    var cssSize = opts.size || 32;
    var paused = false;
    var raf = 0;
    var disposed = false;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function sizeCanvas() {
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = cssSize + 'px';
      canvas.style.height = cssSize + 'px';
    }
    sizeCanvas();

    var ctx = canvas.getContext('2d');
    var preset = window.OrbEngine.resolvePreset(state, 64);
    var clock = 0;
    var last = performance.now();

    function frame(now) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused) clock += dt * speed * (preset.speed || 1);
      var f = window.OrbEngine.MODE_FRAMES[preset.mode](cssSize, clock, preset);
      f = window.OrbEngine.finalizeFrame(f.dots, f.lines, 0.3);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssSize, cssSize);
      window.OrbEngine.paintFrame(ctx, f, dark, tint);
    }
    raf = requestAnimationFrame(frame);

    return {
      setState: function (s) {
        if (s === state) return;
        state = s;
        preset = window.OrbEngine.resolvePreset(state, 64);
      },
      setSpeed: function (v) { speed = v; },
      setPaused: function (p) { paused = p; },
      stop: function () {
        disposed = true;
        cancelAnimationFrame(raf);
      },
    };
  }

  window.createOrb = createOrb;
})();
