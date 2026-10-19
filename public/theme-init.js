// Applies the theme before first paint to avoid a flash. Kept as an external
// file so the CSP never needs 'unsafe-inline' for scripts.
;(function () {
  var pref = 'system'
  try {
    pref = localStorage.getItem('filrouge:theme') || 'system'
  } catch (_) {
    /* storage unavailable */
  }
  var dark =
    pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
})()
