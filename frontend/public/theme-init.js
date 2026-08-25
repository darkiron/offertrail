(function () {
  var stored = localStorage.getItem('offertrail.color-scheme');
  var scheme =
    stored ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');
  document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
})();
