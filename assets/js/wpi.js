/* Wholesale Payments — Sales Dashboard shared behaviors & SVG charts */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AZURE = "#0095E4", GREEN = "#00C878", NAVY = "#00115F",
      SPRING = "#50E878", AMBER = "#E3A21A", ROSE = "#E05B74",
      GRAY = "#AAAFB5", DEEP = "#0072C6";

  /* ---------------- top bar ---------------- */
  var topbar = document.querySelector(".topbar");
  if (topbar) {
    var onScroll = function () {
      topbar.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var burger = document.querySelector(".topbar__burger");
  var mainnav = document.querySelector(".mainnav");
  if (burger && mainnav) {
    burger.addEventListener("click", function () {
      var open = mainnav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------------- dropdown menus ---------------- */
  var drops = Array.prototype.slice.call(document.querySelectorAll(".drop"));
  drops.forEach(function (drop) {
    var btn = drop.querySelector(".drop__btn");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = drop.classList.contains("is-open");
      drops.forEach(function (d) { d.classList.remove("is-open"); });
      if (!wasOpen) drop.classList.add("is-open");
    });
  });
  document.addEventListener("click", function () {
    drops.forEach(function (d) { d.classList.remove("is-open"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") drops.forEach(function (d) { d.classList.remove("is-open"); });
  });

  /* ---------------- tabs ---------------- */
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var btns = root.querySelectorAll(".tabs button");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        root.querySelectorAll(".tabpane").forEach(function (p) {
          p.classList.toggle("is-active", p.id === btn.getAttribute("data-tab"));
        });
      });
    });
  });

  /* ---------------- reveal on scroll ----------------
     NOTE: charts are rendered before this runs (see bottom of file:
     renderAllCharts() is invoked immediately), so `.chart` nodes exist. */
  /* initReveal() runs at the end of this file, AFTER renderAllCharts(),
     so `.chart` nodes exist when the observer collects its targets. */
  function initReveal() {
    var revealables = document.querySelectorAll(".reveal, .chart, .meter");
    function makeVisible(el) { el.classList.add("is-visible"); }
    if ("IntersectionObserver" in window && !reduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { makeVisible(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(makeVisible);
    }
  }

  /* ---------------- count-up numbers ----------------
     <span data-countup data-value="101093" data-format="money">$101,093</span>
     formats: int | money | pct1 ("42%")  — falls back to the literal text  */
  function fmt(n, format) {
    if (format === "money") return "$" + Math.round(n).toLocaleString("en-US");
    if (format === "pct") return Math.round(n) + "%";
    return Math.round(n).toLocaleString("en-US");
  }
  function countUp(el) {
    var v = parseFloat(el.getAttribute("data-value"));
    if (isNaN(v)) return;
    var format = el.getAttribute("data-format") || "int";
    if (reduced) { el.textContent = fmt(v, format); return; }
    var t0 = null, dur = 1300;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(v * e, format);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counts = document.querySelectorAll("[data-countup]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counts.forEach(function (el) { cio.observe(el); });
  } else {
    counts.forEach(countUp);
  }

  /* ---------------- sortable tables ----------------
     add class "sortable" on <table>; th click sorts by column.
     data-sort on td overrides cell text for sorting. */
  function cellKey(tr, i) {
    var td = tr.children[i];
    if (!td) return "";
    var explicit = td.getAttribute("data-sort");
    var raw = explicit !== null ? explicit : td.textContent;
    raw = raw.trim().replace(/[$,%\s]/g, "").replace(/[()]/g, "-");
    var num = parseFloat(raw);
    return isNaN(num) ? td.textContent.trim().toLowerCase() : num;
  }
  document.querySelectorAll("table.sortable").forEach(function (table) {
    var ths = table.querySelectorAll("thead th");
    ths.forEach(function (th, i) {
      if (th.hasAttribute("data-nosort")) return;
      th.classList.add("sortable");
      if (!th.querySelector(".caret")) {
        var c = document.createElement("span");
        c.className = "caret";
        c.textContent = "▾";
        th.appendChild(c);
      }
      th.addEventListener("click", function () {
        var tbody = table.querySelector("tbody");
        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
        var dir = th.classList.contains("desc") ? 1 : -1;
        ths.forEach(function (o) { o.classList.remove("asc", "desc"); });
        th.classList.add(dir === 1 ? "asc" : "desc");
        rows.sort(function (a, b) {
          var ka = cellKey(a, i), kb = cellKey(b, i);
          if (typeof ka === "number" && typeof kb === "number") return (ka - kb) * dir;
          return String(ka).localeCompare(String(kb)) * dir;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });
  });

  /* ---------------- client-side table filter ----------------
     <input data-filter="#tableId"> filters rows by substring */
  document.querySelectorAll("[data-filter]").forEach(function (input) {
    var table = document.querySelector(input.getAttribute("data-filter"));
    if (!table) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      table.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.style.display = !q || tr.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
    });
  });

  /* ---------------- select-based row filter ----------------
     <select data-filter-select="#tableId"> hides rows that don't
     contain the selected value; empty value shows all rows. */
  document.querySelectorAll("[data-filter-select]").forEach(function (sel) {
    var table = document.querySelector(sel.getAttribute("data-filter-select"));
    if (!table) return;
    sel.addEventListener("change", function () {
      var q = sel.value.trim().toLowerCase();
      table.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.style.display = !q || tr.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
    });
  });

  /* =========================================================
     SVG charts — self-contained, no libraries.
     <div class="chart" data-chart='{"kind":"combo", ...}'></div>
     kinds:
       combo  {labels, bars:[{name,values,color?}], line:{name,values,color?}}
       bars   {labels, series:[{name,values,color?}], stacked?}
       area   {labels, values, color?}
       spark  {values, color?}          (tiny area, no axes)
       donut  {segments:[{name,value,color?}], centerLabel?, centerValue?}
     ========================================================= */
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var pow = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / pow;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * pow;
  }
  function shortNum(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(v % 1e3 ? 1 : 0) + "k";
    return String(Math.round(v));
  }
  var PALETTE = [AZURE, GREEN, NAVY, AMBER, ROSE, SPRING, DEEP, GRAY];

  function drawCombo(root, cfg) {
    var W = 640, H = 200, padL = 36, padR = 36, padB = 22, padT = 10;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    svg.style.height = (cfg.height || 200) + "px";
    var labels = cfg.labels || [];
    var bars = cfg.bars || [];
    var line = cfg.line;
    var n = labels.length;
    var iw = (W - padL - padR) / Math.max(n, 1);

    var maxBar = 0;
    for (var i = 0; i < n; i++) {
      var tot = 0;
      bars.forEach(function (s) { tot += (s.values[i] || 0); });
      maxBar = Math.max(maxBar, tot);
    }
    maxBar = niceMax(maxBar);
    var maxLine = line ? niceMax(Math.max.apply(null, line.values)) : 0;

    /* grid */
    for (var g = 0; g <= 2; g++) {
      var gy = padT + (H - padT - padB) * g / 2;
      svg.appendChild(el("line", { x1: padL, x2: W - padR, y1: gy, y2: gy, "class": "grid-line", "stroke-width": 1 }));
    }
    /* axis labels: left = bars scale, right = line scale */
    [0, 1, 2].forEach(function (g) {
      var gy = padT + (H - padT - padB) * g / 2;
      var lv = maxBar * (1 - g / 2);
      var t = el("text", { x: padL - 5, y: gy + 3, "text-anchor": "end", "class": "axis-label" });
      t.textContent = shortNum(lv);
      svg.appendChild(t);
      if (line) {
        var rv = maxLine * (1 - g / 2);
        var t2 = el("text", { x: W - padR + 5, y: gy + 3, "text-anchor": "start", "class": "axis-label" });
        t2.textContent = "$" + shortNum(rv);
        svg.appendChild(t2);
      }
    });

    /* stacked bars */
    var bw = Math.min(iw * 0.42, 18);
    for (var i2 = 0; i2 < n; i2++) {
      var x = padL + iw * i2 + iw / 2 - bw / 2;
      var yCursor = H - padB;
      bars.forEach(function (s, si) {
        var v = s.values[i2] || 0;
        var h = (H - padT - padB) * v / maxBar;
        if (h > 0) {
          var r = el("rect", {
            x: x, y: yCursor - h, width: bw, height: h, rx: 2.5,
            fill: s.color || PALETTE[si], "class": "bar", opacity: 0.9
          });
          r.style.transitionDelay = (i2 * 40) + "ms";
          svg.appendChild(r);
          yCursor -= h;
        }
      });
      if (i2 % Math.ceil(n / 10) === 0 || n <= 12) {
        var lt = el("text", { x: padL + iw * i2 + iw / 2, y: H - 6, "text-anchor": "middle", "class": "axis-label" });
        lt.textContent = labels[i2];
        svg.appendChild(lt);
      }
    }

    /* line overlay */
    if (line) {
      var pts = line.values.map(function (v, i3) {
        var x = padL + iw * i3 + iw / 2;
        var y = padT + (H - padT - padB) * (1 - v / maxLine);
        return [x, y];
      });
      var d = pts.map(function (p, i4) {
        if (i4 === 0) return "M" + p[0] + "," + p[1];
        var prev = pts[i4 - 1];
        var cx = (prev[0] + p[0]) / 2;
        return "C" + cx + "," + prev[1] + " " + cx + "," + p[1] + " " + p[0] + "," + p[1];
      }).join("");
      var path = el("path", {
        d: d, fill: "none", stroke: line.color || NAVY,
        "stroke-width": 2.2, "stroke-linecap": "round", "class": "line-path",
        "vector-effect": "non-scaling-stroke"
      });
      svg.appendChild(path);
      pts.forEach(function (p, pi) {
        var c = el("circle", { cx: p[0], cy: p[1], r: 2.6, fill: "#fff", stroke: line.color || NAVY, "stroke-width": 1.8, "class": "pt" });
        c.style.transitionDelay = (600 + pi * 60) + "ms";
        svg.appendChild(c);
      });
    }
    root.appendChild(svg);
    setPathLen(svg);
  }

  /* measure line paths once attached so the draw-in animation covers the
     full length (the CSS fallback of 1200 leaves long paths partly visible) */
  function setPathLen(svg) {
    svg.querySelectorAll("path.line-path").forEach(function (p) {
      try { p.style.setProperty("--len", p.getTotalLength()); }
      catch (e) { p.style.setProperty("--len", 4000); }
    });
  }

  function drawBars(root, cfg) {
    drawCombo(root, { labels: cfg.labels, bars: cfg.stacked === false ? cfg.series : cfg.series, height: cfg.height });
  }

  function drawArea(root, cfg) {
    var W = 640, H = cfg.axes === false ? 90 : 180;
    var padL = cfg.axes === false ? 4 : 34, padR = 8,
        padB = cfg.axes === false ? 4 : 20, padT = 8;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    svg.style.height = (cfg.height || H) + "px";
    var vals = cfg.values || [];
    var n = vals.length;
    if (!n) { root.appendChild(svg); return; }
    var mx = niceMax(Math.max.apply(null, vals));
    var color = cfg.color || AZURE;
    var uid = "g" + Math.floor(performance.now() * 1000 % 1e9) + (root.id || "");
    var defs = el("defs", {});
    var grad = el("linearGradient", { id: uid, x1: 0, y1: 0, x2: 0, y2: 1 });
    var s1 = el("stop", { offset: "0%", "stop-color": color, "stop-opacity": .22 });
    var s2 = el("stop", { offset: "100%", "stop-color": color, "stop-opacity": 0 });
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

    if (cfg.axes !== false) {
      for (var g = 0; g <= 2; g++) {
        var gy = padT + (H - padT - padB) * g / 2;
        svg.appendChild(el("line", { x1: padL, x2: W - padR, y1: gy, y2: gy, "class": "grid-line", "stroke-width": 1 }));
        var t = el("text", { x: padL - 5, y: gy + 3, "text-anchor": "end", "class": "axis-label" });
        t.textContent = "$" + shortNum(mx * (1 - g / 2));
        svg.appendChild(t);
      }
    }
    var iw = (W - padL - padR) / Math.max(n - 1, 1);
    var pts = vals.map(function (v, i) {
      return [padL + iw * i, padT + (H - padT - padB) * (1 - v / mx)];
    });
    var d = pts.map(function (p, i) {
      if (i === 0) return "M" + p[0] + "," + p[1];
      var prev = pts[i - 1], cx = (prev[0] + p[0]) / 2;
      return "C" + cx + "," + prev[1] + " " + cx + "," + p[1] + " " + p[0] + "," + p[1];
    }).join("");
    var area = el("path", {
      d: d + "L" + pts[n - 1][0] + "," + (H - padB) + "L" + pts[0][0] + "," + (H - padB) + "Z",
      fill: "url(#" + uid + ")", "class": "area-path"
    });
    svg.appendChild(area);
    var path = el("path", {
      d: d, fill: "none", stroke: color, "stroke-width": 2.2,
      "stroke-linecap": "round", "class": "line-path", "vector-effect": "non-scaling-stroke"
    });
    svg.appendChild(path);
    if (cfg.labels && cfg.axes !== false) {
      cfg.labels.forEach(function (lb, i) {
        if (n > 12 && i % Math.ceil(n / 10) !== 0) return;
        var t = el("text", { x: padL + iw * i, y: H - 5, "text-anchor": "middle", "class": "axis-label" });
        t.textContent = lb;
        svg.appendChild(t);
      });
    }
    root.appendChild(svg);
    setPathLen(svg);
  }

  function drawDonut(root, cfg) {
    var size = cfg.size || 168, sw = cfg.thickness || 17;
    var svg = el("svg", { viewBox: "0 0 " + size + " " + size });
    svg.style.height = size + "px";
    svg.style.width = size + "px";
    svg.style.margin = "0 auto";
    var r = (size - sw) / 2, cx = size / 2, cy = size / 2;
    var C = 2 * Math.PI * r;
    var total = 0;
    cfg.segments.forEach(function (s) { total += s.value; });
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: "#EDF1F7", "stroke-width": sw }));
    var acc = 0;
    cfg.segments.forEach(function (s, i) {
      var frac = total ? s.value / total : 0;
      var seg = el("circle", {
        cx: cx, cy: cy, r: r, fill: "none",
        stroke: s.color || PALETTE[i], "stroke-width": sw,
        "stroke-linecap": "butt",
        "stroke-dasharray": (frac * C) + " " + C,
        "stroke-dashoffset": String(-acc * C),
        transform: "rotate(-90 " + cx + " " + cy + ")",
        "class": "donut-seg"
      });
      if (!reduced) {
        seg.setAttribute("stroke-dasharray", "0 " + C);
        setTimeout(function () {
          seg.setAttribute("stroke-dasharray", (frac * C) + " " + C);
        }, 150 + i * 120);
      }
      svg.appendChild(seg);
      acc += frac;
    });
    if (cfg.centerValue) {
      var tv = el("text", { x: cx, y: cy - 2, "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: NAVY });
      tv.setAttribute("font-family", "inherit");
      tv.textContent = cfg.centerValue;
      svg.appendChild(tv);
      var tl = el("text", { x: cx, y: cy + 16, "text-anchor": "middle", "class": "axis-label" });
      tl.textContent = cfg.centerLabel || "";
      svg.appendChild(tl);
    }
    root.appendChild(svg);
  }

  function renderAllCharts() {
    document.querySelectorAll("[data-chart]").forEach(function (node) {
      var cfg;
      try { cfg = JSON.parse(node.getAttribute("data-chart")); } catch (e) { return; }
      node.classList.add("chart");
      if (cfg.kind === "combo") drawCombo(node, cfg);
      else if (cfg.kind === "bars") drawBars(node, cfg);
      else if (cfg.kind === "area" || cfg.kind === "spark") drawArea(node, cfg);
      else if (cfg.kind === "donut") drawDonut(node, cfg);
    });
  }

  /* footer year */
  document.querySelectorAll("[data-year]").forEach(function (n) {
    n.textContent = String(new Date().getFullYear());
  });

  /* ---- init order matters: charts first, then the reveal observer ---- */
  renderAllCharts();
  initReveal();
})();
