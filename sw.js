/* Wholesale Payments Sales Dashboard — service worker
   Precaches the entire static site so it works fully offline
   (installed-to-home-screen on iOS included). */
"use strict";

var VERSION = "wpi-dash-v6";

var PRECACHE = ["./","./Rankings.html","./index.html","./merchants/detail/719070000047137.html","./merchants/detail/719070000047178.html","./merchants/detail/719070000047897.html","./merchants/detail/719070000048788.html","./merchants/detail/719070000048911.html","./merchants/detail/719070000049273.html","./merchants/detail/719070000049638.html","./merchants/detail/719070000050487.html","./merchants/detail/719070000051139.html","./merchants/detail/719070000053143.html","./merchants/detail/719070000053283.html","./merchants/detail/719070000053861.html","./merchants/detail/719070000054026.html","./merchants/detail/719070000054380.html","./merchants/detail/719070000055577.html","./merchants/detail/719070000056435.html","./merchants/detail/719070000056567.html","./merchants/detail/719070000056914.html","./merchants/detail/719070000057813.html","./merchants/detail/719070000058464.html","./merchants/search.html","./payverification/detail.html","./payverification/roster.html","./reports/carcontest2025.html","./reports/gainloss.html","./reports/hpar.html","./reports/nonprocessing.html","./reports/pendingdeals.html","./reports/threshold__p_0.html","./reports/volume.html","./reports/volumeavg.html","./reports/weeklyprocessing.html","./assets/css/wpi.css","./assets/js/wpi.js","./assets/img/favicon.svg","./assets/img/wordmark.png","./assets/img/icon-192.png","./assets/img/icon-512.png","./assets/img/icon-512-maskable.png","./assets/img/apple-touch-icon.png","./manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* network-first for same-origin GETs so updates reach devices immediately;
   the precache serves as the offline fallback */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true });
    })
  );
});
