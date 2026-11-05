// Runs synchronously in <head> before first paint (blocking, non-async script).
// OWASP anti-clickjacking: index.html ships <style id="antiClickjack">html{display:none}</style>.
// Reveal the page only when it is the top-level browsing context; if framed, try to
// break out and leave the page hidden.
(function () {
  var framed;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!framed) {
    var s = document.getElementById("antiClickjack");
    if (s && s.parentNode) s.parentNode.removeChild(s);
  } else {
    try { window.top.location = window.self.location; } catch (e) { /* cross-origin sandbox: stay hidden */ }
  }
})();

// Apply the saved theme before first paint so light-theme users never see a dark flash
// (app.js re-applies the same value later; keep this in sync with getInitialTheme there).
(function () {
  var theme;
  try {
    var saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch (e) { /* storage blocked: fall through to the OS preference */ }
  if (!theme) {
    try { theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
    catch (e) { theme = "dark"; }
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
