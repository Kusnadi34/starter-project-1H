const CACHE_NAME = 'storyapp-v4';
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');

const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}app.bundle.js`,
  `${BASE_PATH}app.css`,
  `${BASE_PATH}favicon.png`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  const url = new URL(event.request.url);
  if (url.pathname.includes('/stories') || url.pathname.includes('/story/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => caches.match('/index.html'))
    );
  }
});

self.addEventListener('push', event => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Story App', body: event.data.text() };
    }
  }

  const title = data.title || 'Story App';
  const options = {
    body: data.body || 'Ada cerita baru nih!',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {
      url: data.url || '/#/story/' + (data.storyId || '')
    },
    actions: [
      {
        action: 'open',
        title: 'Lihat Detail'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data.url;

  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow(url));
  }
});
