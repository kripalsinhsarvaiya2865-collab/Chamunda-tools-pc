var CACHE = 'chamunda-v2';
var SHELL = ['./', './index.html', './manifest.json', './offline.html', './icon-192.png', './icon-512.png'];
var LIBS = [
  'https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(SHELL).then(function(){
      return Promise.all(LIBS.map(function(u){ return c.add(u).catch(function(){}); }));
    });
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  // Firebase database traffic: never cache
  if(url.hostname.indexOf('firebaseio.com') > -1 || url.hostname.indexOf('googleapis.com') > -1) return;
  // App pages: network first, fall back to cache
  if(url.origin === location.origin) {
    e.respondWith(fetch(req).then(function(r){
      var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return r;
    }).catch(function(){ return caches.match(req).then(function(r){ return r || caches.match('./index.html') || caches.match('./offline.html'); }); }));
    return;
  }
  // CDN libraries: cache first
  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(n){
      var copy = n.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return n;
    });
  }));
});
