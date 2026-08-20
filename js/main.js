/* Wholesale Payments — interactions & animations */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav state ---------- */
  var nav = document.getElementById("nav");
  var onScroll = function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("navBurger");
  var links = document.getElementById("navLinks");
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll(".reveal, .step, .zerofee__compare");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    /* data-plain elements keep their literal HTML text (e.g. the year 2007) */
    if (el.getAttribute("data-plain") === "true") return;
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (prefersReduced) {
      el.textContent = formatNum(el, target);
      return;
    }
    var duration = 1600;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* ease-out cubic */
      el.textContent = formatNum(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatNum(el, n) {
    var s = n.toLocaleString("en-US");
    if (el.hasAttribute("data-money")) s = "$" + s;
    return s;
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) {
      if (el.getAttribute("data-plain") === "true") return;
      el.textContent = formatNum(el, parseInt(el.getAttribute("data-count"), 10));
    });
  }

  /* ---------- Hero card pointer tilt ---------- */
  var scene = document.getElementById("cardScene");
  var card = document.getElementById("card3d");
  if (scene && card && !prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    var raf = null;
    scene.addEventListener("pointermove", function (e) {
      var rect = scene.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        card.style.animation = "none";
        card.style.transform =
          "rotateX(" + (8 - y * 16) + "deg) rotateY(" + (-10 + x * 20) + "deg)";
      });
    });
    scene.addEventListener("pointerleave", function () {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = "";
      card.style.animation = "";
      /* restart only the float, skip the intro */
      card.style.animationName = "cardFloat";
      card.style.animationDelay = "0s";
    });
  }

  /* ---------- Parallax orbs ---------- */
  var orbs = document.querySelectorAll("[data-parallax]");
  if (orbs.length && !prefersReduced) {
    var parallaxRaf = null;
    window.addEventListener("scroll", function () {
      if (parallaxRaf) return;
      parallaxRaf = requestAnimationFrame(function () {
        var y = window.scrollY;
        orbs.forEach(function (orb) {
          var speed = parseFloat(orb.getAttribute("data-parallax"));
          orb.style.translate = "0 " + y * speed * 0.3 + "px";
        });
        parallaxRaf = null;
      });
    }, { passive: true });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
