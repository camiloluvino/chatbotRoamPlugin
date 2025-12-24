/**
 * Chatbot Roam Plugin - Auto-Update Loader
 * 
 * Copia este codigo en un bloque {{[[roam/js]]}} en cualquier grafo.
 * El plugin se cargara siempre desde la version mas reciente en GitHub Pages.
 */
var s = document.createElement('script');
// Cache-busting: agrega timestamp para evitar cache
s.src = 'https://camiloluvino.github.io/chatbotRoamPlugin/chatbot-roam-plugin.js?v=' + Date.now();
s.type = 'text/javascript';
s.onload = function () {
    console.log('[Chatbot Roam Plugin] Loaded from GitHub Pages');
};
s.onerror = function () {
    console.error('[Chatbot Roam Plugin] Failed to load from GitHub Pages');
};
document.head.appendChild(s);
