(function () {
  const KEY = "graphai-cookie-consent"
  const HS = "https://js-eu1.hs-scripts.com/148977279.js"

  function loadHubSpot() {
    if (document.getElementById("hs-script-loader")) return
    window._hsq = window._hsq || []
    window._hsp = window._hsp || []
    const s = document.createElement("script")
    s.type = "text/javascript"
    s.id = "hs-script-loader"
    s.async = true
    s.defer = true
    s.src = HS
    document.body.appendChild(s)
  }

  function apply(choice) {
    try {
      localStorage.setItem(KEY, choice)
    } catch {
      /* ignore */
    }
    const banner = document.getElementById("graphaiCookieBanner")
    if (banner) banner.remove()
    if (choice === "accept") loadHubSpot()
  }

  function show() {
    if (document.getElementById("graphaiCookieBanner")) return
    const wrap = document.createElement("div")
    wrap.id = "graphaiCookieBanner"
    wrap.className = "cookie-banner"
    wrap.setAttribute("role", "dialog")
    wrap.setAttribute("aria-label", "Cookie consent")
    wrap.innerHTML =
      "<p><strong>Cookies</strong> — Graphai uses HubSpot to measure visits (EU portal). We only set analytics cookies if you accept. Necessary cookies for sign-in stay on.</p>" +
      '<div class="cookie-actions">' +
      '<button type="button" class="cookie-accept" id="graphaiCookieAccept">Accept</button>' +
      '<button type="button" class="cookie-reject" id="graphaiCookieReject">Reject</button>' +
      "</div>"
    document.body.appendChild(wrap)
    document.getElementById("graphaiCookieAccept").onclick = () => apply("accept")
    document.getElementById("graphaiCookieReject").onclick = () => apply("reject")
  }

  function start() {
    let choice = ""
    try {
      choice = localStorage.getItem(KEY) || ""
    } catch {
      choice = ""
    }
    if (choice === "accept") loadHubSpot()
    else if (choice !== "reject") show()
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start)
  else start()
})()
