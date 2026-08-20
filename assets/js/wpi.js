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
        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"))
          .filter(function (r) { return !r.classList.contains("filter-empty-row"); });
        var dir = th.classList.contains("desc") ? 1 : -1;
        ths.forEach(function (o) { o.classList.remove("asc", "desc"); });
        th.classList.add(dir === 1 ? "asc" : "desc");
        rows.sort(function (a, b) {
          var ka = cellKey(a, i), kb = cellKey(b, i);
          if (typeof ka === "number" && typeof kb === "number") return (ka - kb) * dir;
          return String(ka).localeCompare(String(kb)) * dir;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
        var er = tbody.querySelector(".filter-empty-row");
        if (er) tbody.appendChild(er);
      });
    });
  });

  /* ==========================================================
     Live table filtering — a combining filter hub.
     Controls (selectors may be a comma-separated list of tables):
       <input  data-filter="#tbl">            substring match
       <select data-filter-select="#a,#b">    substring match on value
       <input  data-filter-min="#tbl" data-col="2">   numeric >= value
       <select data-filter-days="#tbl" data-col="6" data-ref="2026-08-20">
                                              date in col within N days of ref
     Team drill-down: <a class="teamlink" href="?team=NAME"> filters every
     table on the page that mentions NAME; ?team= in the URL deep-links it.
     All active filters on a table combine with AND.
     ========================================================== */
  var filterRegs = []; /* {tables[], fn, control, multi} */
  var teamQuery = "";

  function tablesFor(sel) {
    return sel.split(",").map(function (s) {
      return document.querySelector(s.trim());
    }).filter(Boolean);
  }
  function dataRows(table) {
    return Array.prototype.slice.call(table.querySelectorAll("tbody tr"))
      .filter(function (r) { return !r.classList.contains("filter-empty-row"); });
  }
  function registerFilter(sel, fn, control) {
    var tables = tablesFor(sel);
    if (!tables.length) return;
    filterRegs.push({ tables: tables, fn: fn, control: control || null, multi: tables.length > 1 });
  }
  /* The capture sometimes ships controls pre-set to server state that the
     fully-populated static tables don't reflect (e.g. a team preselected
     while every team's row is present). Reset any control whose current
     value would hide rows, so controls start truthful. */
  function sanitizeControls() {
    filterRegs.forEach(function (reg) {
      if (!reg.control) return;
      var hides = reg.tables.some(function (t) {
        return dataRows(t).some(function (tr) { return !reg.fn(tr); });
      });
      if (!hides) return;
      if (reg.control.tagName === "SELECT") {
        for (var i = 0; i < reg.control.options.length; i++) {
          var o = reg.control.options[i];
          if (!o.value.trim() || /^all\b/i.test(o.value.trim()) || /^(all|any)\b/i.test(o.textContent.trim())) {
            reg.control.selectedIndex = i;
            return;
          }
        }
        /* no neutral option — suspend this filter until the user touches it */
        reg.enabled = false;
        reg.control.addEventListener("change", function () { reg.enabled = true; }, { once: true });
      } else if (reg.control.tagName === "INPUT") {
        reg.control.value = "";
      }
    });
  }
  function ensureEmptyRow(table, show) {
    var tbody = table.querySelector("tbody");
    if (!tbody) return;
    var er = tbody.querySelector(".filter-empty-row");
    if (!er && show) {
      er = document.createElement("tr");
      er.className = "filter-empty-row";
      var cols = table.querySelectorAll("thead th").length || 1;
      er.innerHTML = '<td colspan="' + cols + '" style="text-align:center;color:#97A2B6;padding:20px 10px">No rows match the current filter.</td>';
      tbody.appendChild(er);
    }
    if (er) er.style.display = show ? "" : "none";
  }
  function refilter() {
    var teamRe = teamQuery ? entityRe(teamQuery) : null;
    var all = Array.prototype.slice.call(document.querySelectorAll("table.tbl"));
    all.forEach(function (table) {
      var rows = dataRows(table);
      var fns = [];
      filterRegs.forEach(function (reg) {
        if (reg.enabled === false) return;
        if (reg.tables.indexOf(table) === -1) return;
        if (reg.multi && !rows.some(reg.fn)) {
          /* a filter spanning several tables skips tables that lack the
             dimension entirely (e.g. a team select over a By-GM table),
             as long as a sibling table does match */
          var siblingMatches = reg.tables.some(function (t) {
            return t !== table && dataRows(t).some(reg.fn);
          });
          if (siblingMatches) return;
        }
        fns.push(reg.fn);
      });
      if (teamRe) {
        var teamPred = function (tr) { return teamRe.test(tr.textContent); };
        /* only constrain tables that actually mention the team — a By-GM
           table without a team column shouldn't blank out */
        if (rows.some(teamPred)) fns.push(teamPred);
      }
      var any = rows.length === 0;
      rows.forEach(function (tr) {
        var show = fns.every(function (f) { return f(tr); });
        tr.style.display = show ? "" : "none";
        if (show) any = true;
      });
      ensureEmptyRow(table, !any);
    });
  }

  document.querySelectorAll("[data-filter]").forEach(function (input) {
    registerFilter(input.getAttribute("data-filter"), function (tr) {
      var q = input.value.trim().toLowerCase();
      return !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
    }, input);
    input.addEventListener("input", refilter);
  });

  function isAllOption(value, label) {
    return !value.trim() || /^all\b/i.test(value.trim()) || /^(all|any)\b/i.test(label.trim());
  }
  /* entity matching: whole-word, so "Ice" never matches "Service" */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function entityRe(q) {
    return new RegExp("(^|[^A-Za-z0-9])" + escRe(q.trim()).replace(/\s+/g, "\\s+") + "($|[^A-Za-z0-9])", "i");
  }

  /* Rebuild a filter select's options from the data actually present in its
     target tables, so every option is guaranteed to match rows. The source
     column is data-col if given, else the column whose header matches the
     field's label. Returns false (leaving options untouched) when no column
     can be identified. */
  function rebuildSelectOptions(sel, tables) {
    var field = sel.closest ? sel.closest(".field") : null;
    var labEl = field ? field.querySelector("label") : null;
    var label = labEl ? labEl.textContent.trim().toLowerCase().replace(/[?:]/g, "") : "";
    var dataCol = sel.getAttribute("data-col");
    var values = [], seen = {};
    tables.forEach(function (t) {
      var col = -1;
      if (dataCol) {
        col = parseInt(dataCol, 10);
      } else if (label) {
        var ths = t.querySelectorAll("thead th");
        for (var i = 0; i < ths.length; i++) {
          var h = ths[i].textContent.trim().toLowerCase().replace(/[▾▴]/g, "").trim();
          if (!h) continue;
          if (h === label || h.indexOf(label) !== -1 || label.indexOf(h) !== -1 ||
              (h.length >= 5 && label.length >= 5 && h.slice(0, 5) === label.slice(0, 5))) {
            col = i;
            break;
          }
        }
      }
      if (col < 0) return;
      dataRows(t).forEach(function (tr) {
        var td = tr.children[col];
        if (!td) return;
        var link = td.querySelector(".teamlink, .ent");
        var v;
        if (link) {
          v = link.textContent;
        } else {
          var clone = td.cloneNode(true);
          clone.querySelectorAll(".sub").forEach(function (s) { s.remove(); });
          v = clone.textContent;
        }
        v = v.trim().replace(/\s+/g, " ");
        if (!v || v === "—" || v === "-") return;
        var k = v.toLowerCase();
        if (!seen[k]) { seen[k] = true; values.push(v); }
      });
    });
    if (!values.length) return false;
    values.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
    sel.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = "All (" + values.length + ")";
    sel.appendChild(all);
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    sel.selectedIndex = 0;
    return true;
  }

  document.querySelectorAll("[data-filter-select]").forEach(function (sel) {
    var tables = tablesFor(sel.getAttribute("data-filter-select"));
    rebuildSelectOptions(sel, tables);
    var cached = { q: null, re: null };
    registerFilter(sel.getAttribute("data-filter-select"), function (tr) {
      var opt = sel.options[sel.selectedIndex];
      var label = opt ? opt.textContent : sel.value;
      if (isAllOption(sel.value, label)) return true;
      var q = label.trim();
      if (!q) return true;
      if (cached.q !== q) { cached.q = q; cached.re = entityRe(q); }
      return cached.re.test(tr.textContent);
    }, sel);
    sel.addEventListener("change", refilter);
  });

  document.querySelectorAll("[data-filter-min]").forEach(function (input) {
    var col = parseInt(input.getAttribute("data-col"), 10) || 0;
    registerFilter(input.getAttribute("data-filter-min"), function (tr) {
      var min = parseFloat(input.value.replace(/[$,\s]/g, ""));
      if (isNaN(min)) return true;
      var td = tr.children[col];
      if (!td) return true;
      var v = parseFloat((td.getAttribute("data-sort") || td.textContent).replace(/[$,\s]/g, ""));
      return isNaN(v) ? true : v >= min;
    }, input);
    input.addEventListener("input", refilter);
  });

  document.querySelectorAll("[data-filter-days]").forEach(function (sel) {
    var col = parseInt(sel.getAttribute("data-col"), 10) || 0;
    var ref = new Date(sel.getAttribute("data-ref") + "T12:00:00");
    registerFilter(sel.getAttribute("data-filter-days"), function (tr) {
      var days = parseInt(sel.value, 10);
      if (isNaN(days)) return true;
      var td = tr.children[col];
      if (!td) return true;
      var d = new Date(td.textContent.trim());
      if (isNaN(d.getTime())) return true;
      return (ref - d) / 86400000 <= days;
    }, sel);
    sel.addEventListener("change", refilter);
  });

  sanitizeControls();

  /* ---------------- processing-status filter ----------------
     <select data-filter-proc="#tbl" data-col="10">
       options: value "" = all, "yes" = processing, "no" = not processing */
  document.querySelectorAll("[data-filter-proc]").forEach(function (sel) {
    var col = parseInt(sel.getAttribute("data-col"), 10) || 0;
    registerFilter(sel.getAttribute("data-filter-proc"), function (tr) {
      var v = sel.value.trim().toLowerCase();
      if (!v || v === "all") return true;
      var td = tr.children[col];
      if (!td) return true;
      if (v === "yes") return !!td.querySelector(".badge--ok");
      if (v === "no") return !!td.querySelector(".badge--off");
      return true;
    }, sel);
    sel.addEventListener("change", refilter);
  });

  /* ---------------- date-range popover filter ----------------
     <div class="pick" data-daterange="#tbl" data-col="2"> — filters rows
     by the yyyymmdd data-sort key in the given column. */
  function closePickers(except) {
    document.querySelectorAll(".pick.is-open").forEach(function (p) {
      if (p !== except) p.classList.remove("is-open");
    });
  }
  document.addEventListener("click", function () { closePickers(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePickers(null); });

  document.querySelectorAll("[data-daterange]").forEach(function (root) {
    var col = parseInt(root.getAttribute("data-col"), 10) || 0;
    var state = { from: 0, to: 0 };
    root.classList.add("pick");
    root.innerHTML =
      '<button type="button" class="pick__btn"><span>All Dates</span>' +
      '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="pick__pop" style="min-width:230px">' +
      '<div class="range__row"><label>From</label><input type="date"></div>' +
      '<div class="range__row"><label>To</label><input type="date"></div>' +
      '<div class="range__actions"><button type="button" class="btn btn--primary btn--sm">Apply</button>' +
      '<button type="button" class="btn btn--sm">Clear</button></div></div>';
    var btn = root.querySelector(".pick__btn");
    var label = btn.querySelector("span");
    var pop = root.querySelector(".pick__pop");
    var inputs = root.querySelectorAll("input");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = root.classList.contains("is-open");
      closePickers(null);
      if (!open) root.classList.add("is-open");
    });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    function key(v) { return v ? parseInt(v.replace(/-/g, ""), 10) : 0; }
    function fmt(v) { var p = v.split("-"); return parseInt(p[1], 10) + "/" + parseInt(p[2], 10); }
    root.querySelector(".btn--primary").addEventListener("click", function () {
      state.from = key(inputs[0].value);
      state.to = key(inputs[1].value);
      if (state.from || state.to) {
        label.textContent = (inputs[0].value ? fmt(inputs[0].value) : "…") + " – " +
                            (inputs[1].value ? fmt(inputs[1].value) : "…");
      } else {
        label.textContent = "All Dates";
      }
      root.classList.remove("is-open");
      refilter();
    });
    root.querySelector(".btn:not(.btn--primary)").addEventListener("click", function () {
      inputs[0].value = ""; inputs[1].value = "";
      state.from = 0; state.to = 0;
      label.textContent = "All Dates";
      root.classList.remove("is-open");
      refilter();
    });
    registerFilter(root.getAttribute("data-daterange"), function (tr) {
      if (!state.from && !state.to) return true;
      var td = tr.children[col];
      if (!td) return true;
      var k = parseInt(td.getAttribute("data-sort") || "0", 10);
      if (!k) return false;
      if (state.from && k < state.from) return false;
      if (state.to && k > state.to) return false;
      return true;
    });
  });

  /* ---------------- month / YTD picker ----------------
     <div class="pick" data-monthpick='{"value":"2026-08","enabled":[...],"target":"#sel"}'>
     Keys: "YYYY-MM" and "YTD-YYYY". With a target select (the period state
     holder), picking an enabled key sets it; without one, only display. */
  var MONTHS_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function pickKeyToOption(k) {
    if (k.indexOf("YTD-") === 0) return k.slice(4) + " YTD";
    var p = k.split("-");
    return MONTHS_ABBR[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  function pickKeyLabel(k) {
    if (k.indexOf("YTD-") === 0) return "YTD " + k.slice(4);
    var p = k.split("-");
    return MONTHS_ABBR[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  document.querySelectorAll("[data-monthpick]").forEach(function (root) {
    var cfg;
    try { cfg = JSON.parse(root.getAttribute("data-monthpick")); } catch (e) { return; }
    var enabled = {};
    (cfg.enabled || []).forEach(function (k) { enabled[k] = true; });
    var value = cfg.value;
    var target = cfg.target ? document.querySelector(cfg.target) : null;
    var year = parseInt((value || "2026-08").slice(value.indexOf("YTD-") === 0 ? 4 : 0, value.indexOf("YTD-") === 0 ? 8 : 4), 10) || 2026;
    var MINY = 2025, MAXY = 2026;
    root.classList.add("pick");
    root.innerHTML =
      '<button type="button" class="pick__btn"><span></span>' +
      '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="pick__pop"></div>';
    var btn = root.querySelector(".pick__btn");
    var label = btn.querySelector("span");
    var pop = root.querySelector(".pick__pop");
    function setValue(k) {
      if (!enabled[k]) return;
      value = k;
      label.textContent = pickKeyLabel(k);
      if (target) {
        target.value = pickKeyToOption(k);
        var ev = document.createEvent("HTMLEvents");
        ev.initEvent("change", true, false);
        target.dispatchEvent(ev);
      }
      root.classList.remove("is-open");
      renderPop();
    }
    function renderPop() {
      var html = '<div class="pick__ytd">';
      [MAXY, MINY].forEach(function (y) {
        var k = "YTD-" + y;
        html += '<button type="button" data-k="' + k + '" class="' +
          (value === k ? "is-sel " : "") + (enabled[k] ? "" : "is-off") +
          '"' + (enabled[k] ? "" : ' title="Not in this snapshot"') + ">YTD " + y + "</button>";
      });
      html += "</div>";
      html += '<div class="pick__year">' +
        '<button type="button" data-nav="-1"' + (year <= MINY ? " disabled" : "") + '>&lsaquo;</button>' +
        "<b>" + year + "</b>" +
        '<button type="button" data-nav="1"' + (year >= MAXY ? " disabled" : "") + '>&rsaquo;</button></div>';
      html += '<div class="pick__grid">';
      for (var m = 1; m <= 12; m++) {
        var k2 = year + "-" + (m < 10 ? "0" + m : m);
        html += '<button type="button" data-k="' + k2 + '" class="pick__m ' +
          (value === k2 ? "is-sel " : "") + (enabled[k2] ? "" : "is-off") +
          '"' + (enabled[k2] ? "" : ' title="Not in this snapshot"') + ">" + MONTHS_ABBR[m - 1] + "</button>";
      }
      html += "</div>";
      pop.innerHTML = html;
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = root.classList.contains("is-open");
      closePickers(null);
      if (!open) { renderPop(); root.classList.add("is-open"); }
    });
    pop.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target.closest ? e.target.closest("button") : null;
      if (!t) return;
      if (t.getAttribute("data-nav")) {
        year += parseInt(t.getAttribute("data-nav"), 10);
        renderPop();
        return;
      }
      var k = t.getAttribute("data-k");
      if (k) setValue(k);
    });
    label.textContent = pickKeyLabel(value);
    /* stay in sync when the target changes some other way (deep links) */
    if (target) {
      target.addEventListener("change", function () {
        var tv = target.value;
        var found = null;
        (cfg.enabled || []).forEach(function (k) { if (pickKeyToOption(k) === tv) found = k; });
        if (found) { value = found; label.textContent = pickKeyLabel(found); }
      });
      var tv0 = target.value;
      (cfg.enabled || []).forEach(function (k) {
        if (pickKeyToOption(k) === tv0) { value = k; label.textContent = pickKeyLabel(k); }
      });
    }
  });

  /* ----- team drill-down ----- */
  function setTeam(name, updateUrl) {
    teamQuery = (name || "").trim();
    var chip = document.querySelector(".filterchip");
    if (teamQuery) {
      if (!chip) {
        chip = document.createElement("div");
        chip.className = "filterchip";
        var head = document.querySelector(".pagehead");
        if (head && head.parentNode) head.parentNode.insertBefore(chip, head.nextSibling);
        else document.querySelector(".page .shell").insertBefore(chip, document.querySelector(".page .shell").firstChild);
      }
      chip.innerHTML = 'Filtered to <b></b> <button type="button" aria-label="Clear team filter">&#10005;</button>';
      chip.querySelector("b").textContent = teamQuery;
      chip.querySelector("button").addEventListener("click", function () { setTeam("", true); });
    } else if (chip) {
      chip.remove();
    }
    refilter();
    if (updateUrl && window.history && history.replaceState) {
      var url = location.pathname + (teamQuery ? "?team=" + encodeURIComponent(teamQuery) : "") + location.hash;
      history.replaceState(null, "", url);
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a.teamlink") : null;
    if (!a) return;
    e.preventDefault();
    var name = "";
    try { name = new URL(a.href, location.href).searchParams.get("team") || ""; } catch (err) {}
    setTeam(name || a.textContent.trim(), true);
    var chip = document.querySelector(".filterchip");
    if (chip) chip.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  });
  (function () {
    var team = "";
    try { team = new URLSearchParams(location.search).get("team") || ""; } catch (err) {}
    if (team) setTeam(team, false);
  })();

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

  /* charts render 1:1 at the container's real pixel width — a stretched
     viewBox distorts text/dots and breaks the dash-based line animation */
  function chartWidth(root) {
    var w = root.clientWidth;
    if (!w && root.parentNode) w = root.parentNode.clientWidth;
    return Math.max(w || 640, 300);
  }

  function drawCombo(root, cfg) {
    var W = chartWidth(root), H = cfg.height || 200,
        padL = 42, padR = cfg.line ? 46 : 14, padB = 22, padT = 10;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    svg.style.height = H + "px";
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
        "stroke-width": 2.2, "stroke-linecap": "round", "class": "line-path"
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
    var W = chartWidth(root), H = cfg.height || (cfg.axes === false ? 90 : 180);
    var padL = cfg.axes === false ? 4 : 40, padR = 8,
        padB = cfg.axes === false ? 4 : 20, padT = 8;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    svg.style.height = H + "px";
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
      "stroke-linecap": "round", "class": "line-path"
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
    root.classList.add("chart-donut"); /* fixed-size; exempt from resize redraws */
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

  function renderChart(node) {
    var cfg;
    try { cfg = JSON.parse(node.getAttribute("data-chart")); } catch (e) { return; }
    node.classList.add("chart");
    node.innerHTML = "";
    if (cfg.kind === "combo") drawCombo(node, cfg);
    else if (cfg.kind === "bars") drawBars(node, cfg);
    else if (cfg.kind === "area" || cfg.kind === "spark") drawArea(node, cfg);
    else if (cfg.kind === "donut") drawDonut(node, cfg);
  }
  function renderAllCharts() {
    document.querySelectorAll("[data-chart]").forEach(renderChart);
  }
  /* charts are drawn at true pixel width — redraw when the layout changes */
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll("[data-chart]").forEach(function (node) {
        var svg = node.querySelector("svg");
        if (!svg || node.classList.contains("chart-donut")) return;
        var vb = (svg.getAttribute("viewBox") || "").split(" ");
        if (Math.abs((parseFloat(vb[2]) || 0) - chartWidth(node)) > 8) renderChart(node);
      });
    }, 180);
  });

  /* footer year */
  document.querySelectorAll("[data-year]").forEach(function (n) {
    n.textContent = String(new Date().getFullYear());
  });

  /* ---------------- mobile bottom tab bar (PWA) ----------------
     Built at runtime from the page's data-root prefix; shown ≤900px.
     Active tab derived from the current path. */
  function initTabbar() {
    var root = document.documentElement.getAttribute("data-root");
    if (root === null) return;
    var path = location.pathname;
    var ICONS = {
      home: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4V15h-5v5.5h-4A1.5 1.5 0 0 1 4 19v-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      trophy: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 5H5v1.5A3.5 3.5 0 0 0 8.5 10M16 5h3v1.5A3.5 3.5 0 0 1 15.5 10M12 13v4m-3.5 3h7M12 17c-1.2 0-2.3.9-2.9 3h5.8c-.6-2.1-1.7-3-2.9-3Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      store: '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 9 6 4.5h12L19.5 9M4.5 9v10.5h15V9M4.5 9h15M10 19.5v-6h4v6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      cash: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12.5" r="2.6" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 10.2v.1m11-.1v.1m-11 4.5v.1m11-.1v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      menu: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>'
    };
    var tabs = [
      { href: root + "index.html", label: "Home", icon: "home",
        active: /(^|\/)(index\.html)?$/.test(path) },
      { href: root + "Rankings.html", label: "Rankings", icon: "trophy",
        active: /\/Rankings\.html$/.test(path) },
      { href: root + "merchants/search.html", label: "Merchants", icon: "store",
        active: path.indexOf("/merchants/") !== -1 },
      { href: root + "payverification/detail.html", label: "Kaching", icon: "cash",
        active: path.indexOf("/payverification/") !== -1 },
    ];
    var bar = document.createElement("nav");
    bar.className = "tabbar";
    bar.setAttribute("aria-label", "Quick navigation");
    bar.innerHTML = tabs.map(function (t) {
      return '<a href="' + t.href + '"' + (t.active ? ' class="is-active"' : "") + ">" +
        ICONS[t.icon] + "<span>" + t.label + "</span></a>";
    }).join("") +
      '<button type="button" class="tabbar__menu' + (path.indexOf("/reports/") !== -1 ? " is-active" : "") + '">' +
      ICONS.menu + "<span>Menu</span></button>";
    document.body.appendChild(bar);
    bar.querySelector(".tabbar__menu").addEventListener("click", function () {
      if (mainnav) {
        var open = mainnav.classList.toggle("is-open");
        if (burger) burger.setAttribute("aria-expanded", String(open));
        if (open) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }
    });
  }

  /* ---------------- service worker (offline PWA) ---------------- */
  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    var root = document.documentElement.getAttribute("data-root") || "";
    navigator.serviceWorker.register(root + "sw.js").catch(function () {
      /* file:// or unsupported context — the site still works online */
    });
  }

  /* ---------------- Team MAVERICK period filter ----------------
     Reads the embedded spreadsheet dataset (#mav-data) and re-renders
     the KPI strip and tables for the selected month / 2026 YTD. */
  function initMavPeriod() {
    var dataEl = document.getElementById("mav-data");
    var sel = document.getElementById("mavPeriod");
    if (!dataEl || !sel) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var HASPAGE = {};
    document.querySelectorAll("#mavMerch a.ent").forEach(function (a) {
      var m = a.getAttribute("href").match(/(\d{12,16})\.html$/);
      if (m) HASPAGE[m[1]] = true;
    });
    function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
    function pct(r) { return (Math.round(r * 1000) / 10).toFixed(1) + "%"; }
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function teamA(name) {
      return '<a class="teamlink" href="?team=' + encodeURIComponent(name) + '">' + esc(name) + "</a>";
    }
    function emptyRow(cols) {
      return '<tr><td colspan="' + cols + '" style="text-align:center;color:#97A2B6;padding:26px">No deals reported for Team MAVERICK in this period.</td></tr>';
    }
    function label(key) { return key === "2026 YTD" ? "2026 YTD" : key; }
    function render(key) {
      var m = data.months[key];
      if (!m) return;
      var s = m.summary;
      document.getElementById("mavKpis").innerHTML = [
        ["Approved", s.approved], ["Processing", s.processing], ["Not Processing", s.notProcessing],
        ["Ratio", pct(s.ratio)], ["Installed", s.installed],
        ["Commission", money(s.commission)], ["Volume", money(s.volume)],
        ["Transactions", s.transactions.toLocaleString("en-US")]
      ].map(function (p) {
        return '<div class="mavkpi"><b>' + p[1] + "</b><span>" + p[0] + "</span></div>";
      }).join("");
      document.querySelector("#mavByRep tbody").innerHTML = m.byRep.length ? m.byRep.map(function (r) {
        return "<tr><td>" + teamA(r.rep) + '</td><td class="num">' + r.approved +
          '</td><td class="num">' + r.processing + '</td><td class="num">' + r.notProcessing +
          '</td><td class="num">' + pct(r.ratio) + '</td><td class="num">' + money(r.commission) +
          '</td><td class="num">' + money(r.volume) + "</td></tr>";
      }).join("") : emptyRow(7);
      document.querySelector("#mavByPay tbody").innerHTML = m.byPay.length ? m.byPay.map(function (p) {
        return "<tr><td>" + esc(p.type) + '</td><td class="num">' + p.deals +
          '</td><td class="num">' + p.processing + '</td><td class="num">' + money(p.commission) +
          '</td><td class="num">' + money(p.volume) + "</td></tr>";
      }).join("") : emptyRow(5);
      document.querySelector("#mavMerch tbody").innerHTML = m.merchants.length ? m.merchants.map(function (r) {
        var name = HASPAGE[r.mid]
          ? '<a class="ent" href="../merchants/detail/' + r.mid + '.html">' + esc(r.name) + "</a>"
          : '<span style="font-weight:600">' + esc(r.name) + "</span>";
        var days = r.days === null || r.days === undefined ? "" : String(r.days);
        return "<tr><td>" + teamA(r.rep) + "</td><td>" + name + '<span class="sub">' + r.mid + "</span></td>" +
          '<td class="num" data-sort="' + r.approvedK + '">' + (r.approved || "&mdash;") + "</td>" +
          '<td class="num" data-sort="' + r.deliveredK + '">' + (r.delivered || "&mdash;") + "</td>" +
          '<td class="num" data-sort="' + r.installedK + '">' + (r.installed || "&mdash;") + "</td>" +
          '<td class="num" data-sort="' + (days || 0) + '">' + (days || "&mdash;") + "</td>" +
          "<td>" + esc(r.payment) + "</td>" +
          '<td class="num">' + (r.commission > 0 ? money(r.commission) : "&mdash;") + "</td>" +
          '<td class="num">' + money(r.volume) + "</td>" +
          '<td class="num">' + r.txns + "</td>" +
          '<td class="ctr">' + (r.processing ? '<span class="badge badge--ok">Yes</span>' : '<span class="badge badge--off">No</span>') + "</td>" +
          '<td class="num" data-sort="' + r.lastBatchK + '">' + (r.lastBatch || "&mdash;") + "</td></tr>";
      }).join("") : emptyRow(12);
      document.getElementById("mavMerchCount").textContent = m.merchants.length + " deals";
      var t1 = document.getElementById("mavPeriodTag1"), t2 = document.getElementById("mavPeriodTag2");
      if (t1) t1.textContent = label(key);
      if (t2) t2.textContent = label(key);
      refilter(); /* re-apply any live search/team filters to the new rows */
    }
    sel.addEventListener("change", function () {
      render(sel.value);
      if (window.history && history.replaceState) {
        history.replaceState(null, "", location.pathname + "?p=" + encodeURIComponent(sel.value));
      }
    });
    var p = null;
    try { p = new URLSearchParams(location.search).get("p"); } catch (e) {}
    if (p && data.months[p]) {
      sel.value = p;
      render(p);
      /* let linked controls (month picker) sync their labels */
      var ev = document.createEvent("HTMLEvents");
      ev.initEvent("change", true, false);
      sel.dispatchEvent(ev);
    }
  }

  /* ---- init order matters: charts first, then the reveal observer ---- */
  renderAllCharts();
  initReveal();
  initTabbar();
  initServiceWorker();
  initMavPeriod();
})();
