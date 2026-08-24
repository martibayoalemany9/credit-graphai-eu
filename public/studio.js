const CSV_FIELDS = ["country", "iso", "private", "public", "style", "notes", "access", "bureaus", "urls"]
let catalog = { countries: [], gdpr: "" }
let view = "gallery"
let openRows = new Set()
let toastHideTimer = 0

const $ = (id) => document.getElementById(id)
const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]))

function filtered() {
  const needle = ($("q").value || "").trim().toLowerCase()
  const cat = $("st").value
  return catalog.countries.filter((co) => {
    if (cat && co.style !== cat) return false
    if (!needle) return true
    const blob = [
      co.country, co.iso, co.private, co.public, co.system, co.styleLabel, co.notes, co.access,
      ...(co.bureaus || []).map((b) => [b.name, b.role, b.url].join(" ")),
    ].join(" ").toLowerCase()
    return blob.includes(needle)
  })
}

function styleClass(style) {
  if (style === "comprehensive") return "ok"
  if (style === "negative") return "no"
  return "maybe"
}

function styleBubble(co) {
  return `<span class="auto-bubble ${styleClass(co.style)}" tabindex="0" data-kind="${esc(co.styleLabel)}" data-text="${esc(co.notes)}"><b>Style</b> ${esc(co.styleLabel)}</span>`
}

function card(co) {
  const el = document.createElement("article")
  el.className = "card"
  el.innerHTML = `
    <div class="flag flag-${esc(co.id)}" aria-hidden="true"><span>${esc(co.iso)}</span></div>
    <div class="cap">
      <strong>${esc(co.country)}</strong>
      <div class="badge on">${esc(co.private || co.system || "—")}</div>
      <p class="muted"><b>Public:</b> ${esc(co.public || "—")}</p>
      <div class="auto-bubbles">${styleBubble(co)}</div>
      <p class="muted">${esc(co.notes)}</p>
      <ul class="bureau-list">${(co.bureaus || []).map((b) =>
        `<li><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(b.name)}</a></li>`
      ).join("")}</ul>
    </div>`
  return el
}

function nestedHtml(co) {
  const rows = (co.bureaus || []).map((b) => `<tr>
    <td><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(b.name)}</a></td>
    <td>${esc(b.role)}</td>
  </tr>`).join("")
  return `<table class="jobs">
    <thead><tr><th>Bureau</th><th>Role</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function tableRow(co, i) {
  const open = openRows.has(i)
  const nested = open ? `<tr class="nested" data-for="${i}"><td colspan="5">${nestedHtml(co)}</td></tr>` : ""
  return `<tr class="co ${open ? "open" : ""}" data-i="${i}">
    <td><button type="button" class="exp" data-exp="${i}" aria-expanded="${open}">${open ? "▾" : "▸"}</button> <strong>${esc(co.country)}</strong>
      <div class="muted">${esc(co.iso)}</div></td>
    <td>${esc(co.private || "—")}</td>
    <td>${esc(co.public || "—")}</td>
    <td class="auto-cell">${styleBubble(co)}</td>
    <td>${esc(co.notes)}</td>
  </tr>${nested}`
}

function toggleExpand(root, i) {
  const tr = root.querySelector(`tr.co[data-i="${i}"]`)
  if (!tr) return
  const btn = tr.querySelector(".exp")
  const existing = root.querySelector(`tr.nested[data-for="${i}"]`)
  if (openRows.has(i) && existing) {
    openRows.delete(i)
    existing.remove()
    tr.classList.remove("open")
    if (btn) { btn.textContent = "▸"; btn.setAttribute("aria-expanded", "false") }
    return
  }
  openRows.add(i)
  const co = catalog.countries[i]
  if (!co) return
  existing?.remove()
  tr.insertAdjacentHTML("afterend", `<tr class="nested" data-for="${i}"><td colspan="5">${nestedHtml(co)}</td></tr>`)
  tr.classList.add("open")
  if (btn) { btn.textContent = "▾"; btn.setAttribute("aria-expanded", "true") }
}

function bindTable(root) {
  root.querySelectorAll("tr.co").forEach((tr) => {
    tr.addEventListener("click", (ev) => {
      if (ev.target.closest("a")) return
      toggleExpand(root, Number(tr.dataset.i))
    })
  })
  bindToasts(root)
}

function hideToastSoon() {
  clearTimeout(toastHideTimer)
  toastHideTimer = setTimeout(() => {
    const toast = $("policyToast")
    if (toast) toast.hidden = true
  }, 180)
}

function showToast(bubble) {
  const toast = $("policyToast")
  if (!toast) return
  clearTimeout(toastHideTimer)
  toast.innerHTML = `<strong>${esc(bubble.dataset.kind || "Style")}</strong><p>${esc(bubble.dataset.text || "")}</p>`
  toast.hidden = false
  const r = bubble.getBoundingClientRect()
  const width = Math.min(320, window.innerWidth - 24)
  let left = r.right - width
  if (left < 12) left = 12
  if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12
  toast.style.left = left + "px"
  toast.style.width = width + "px"
  const h = 140
  let top = r.bottom + 10
  if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 10)
  toast.style.top = top + "px"
}

function bindToasts(root) {
  root.querySelectorAll(".auto-bubble").forEach((bubble) => {
    bubble.addEventListener("mouseenter", () => showToast(bubble))
    bubble.addEventListener("focus", () => showToast(bubble))
    bubble.addEventListener("mouseleave", hideToastSoon)
    bubble.addEventListener("blur", hideToastSoon)
  })
}

function setView(next) {
  view = next === "table" ? "table" : "gallery"
  document.body.classList.toggle("mode-table", view === "table")
  document.body.classList.toggle("mode-gallery", view === "gallery")
  $("viewGallery").classList.toggle("on", view === "gallery")
  $("viewTable").classList.toggle("on", view === "table")
  render()
}

function render() {
  const rows = filtered()
  $("count").textContent = `${rows.length} of ${catalog.countries.length} country systems`
  const grid = $("grid")
  const tableWrap = $("tableWrap")
  if (view === "gallery") {
    grid.classList.remove("is-hidden")
    tableWrap.classList.add("is-hidden")
    grid.replaceChildren(...rows.map(card))
    bindToasts(grid)
  } else {
    grid.classList.add("is-hidden")
    tableWrap.classList.remove("is-hidden")
    tableWrap.innerHTML = `<div class="table-scroller"><table class="studio">
      <thead><tr><th>Country</th><th>Main private bureau(s) / ACCIS members</th><th>Public / central register</th><th>Style</th><th>Notes</th></tr></thead>
      <tbody>${rows.map((co) => tableRow(co, catalog.countries.indexOf(co))).join("")}</tbody>
    </table></div>`
    bindTable(tableWrap)
  }
}

function csvEscape(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`
}

function downloadCsv() {
  const lines = [CSV_FIELDS.join(",")]
  filtered().forEach((co) => {
    const rec = {
      country: co.country,
      iso: co.iso,
      private: co.private || "",
      public: co.public || "",
      style: co.styleLabel,
      notes: co.notes,
      access: co.access || "",
      bureaus: (co.bureaus || []).map((b) => b.name).join("|"),
      urls: (co.bureaus || []).map((b) => b.url).join("|"),
    }
    lines.push(CSV_FIELDS.map((k) => csvEscape(rec[k])).join(","))
  })
  const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "credit-ratings-graphai-countries.csv"
  a.click()
  URL.revokeObjectURL(a.href)
}

$("q").addEventListener("input", render)
$("st").addEventListener("change", render)
$("viewGallery").addEventListener("click", () => setView("gallery"))
$("viewTable").addEventListener("click", () => setView("table"))
$("dlTable").addEventListener("click", downloadCsv)
const toast = $("policyToast")
if (toast) {
  toast.addEventListener("mouseenter", () => clearTimeout(toastHideTimer))
  toast.addEventListener("mouseleave", hideToastSoon)
}

fetch("/data.json")
  .then((r) => r.json())
  .then((data) => {
    catalog = data
    $("gdprLine").textContent = data.gdpr || ""
    render()
  })
  .catch((err) => { $("count").textContent = "Could not load data.json: " + err.message })
