// Ping anônimo de visita (sem cookies). Registra página, tag (?v=) e domínio de origem.
(function () {
  try {
    var p = location.pathname || "/";
    var v = new URLSearchParams(location.search).get("v") || "";
    var r = "";
    try { r = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
    fetch("/api/hit?path=" + encodeURIComponent(p) + "&tag=" + encodeURIComponent(v) +
          "&ref=" + encodeURIComponent(r), { keepalive: true });
  } catch (e) {}
})();
