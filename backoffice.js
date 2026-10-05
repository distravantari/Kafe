// Kafe back office. Reads the same localStorage as the POS, so changes show up at the counter.

const $ = (s, r = document) => r.querySelector(s);
const rp = Kafe.rp;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const short = (n) => n >= 1e6 ? (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
const METHOD_COLOR = { Cash: "var(--s1)", QRIS: "var(--s2)", Card: "var(--s3)" };
const TYPE_COLOR = { "Dine in": "var(--s1)", Takeaway: "var(--s2)" };
const dayKey = (d) => new Date(d).toLocaleDateString("en-CA");
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

let range = KafeStore.get("kafe.bo.range", "today");

// ───────── helpers ─────────
function startOf(daysAgo) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - daysAgo); return d; }
function inRange(orders, from, to) { return orders.filter((o) => { const t = new Date(o.at); return t >= from && t < to; }); }
function periodOrders(r) {
  const all = Kafe.orders();
  const now = new Date(); const tomorrow = startOf(-1);
  if (r === "today") return { cur: inRange(all, startOf(0), tomorrow), prev: inRange(all, startOf(1), new Date(now - 864e5)), prevLabel: "vs. same time yesterday" };
  return { cur: inRange(all, startOf(6), tomorrow), prev: inRange(all, startOf(13), startOf(6)), prevLabel: "vs. previous 7 days" };
}
function stats(orders) {
  const net = orders.reduce((a, o) => a + o.subtotal, 0);
  const items = orders.reduce((a, o) => a + o.lines.reduce((b, l) => b + l.qty, 0), 0);
  return { net, count: orders.length, avg: orders.length ? net / orders.length : 0, items };
}
function delta(cur, prev) {
  if (!prev) return `<span class="delta">— no earlier data</span>`;
  const p = ((cur - prev) / prev) * 100;
  const cls = p >= 0.5 ? "up" : p <= -0.5 ? "down" : "";
  return `<span class="delta ${cls}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(0)}%</span>`;
}

// Vertical bar chart (single series, so no legend — the card title names it).
function barChart(data, label) {
  const W = 640, H = 240, L = 44, B = 26, T = 10;
  const max = Math.max(...data.map((d) => d.v), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const nice = Math.ceil(max / step / 2) * step * 2 || 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * nice);
  const bw = (W - L) / data.length;
  const barW = Math.min(36, bw - 6);
  const y = (v) => T + (H - T - B) * (1 - v / nice);
  const labelEvery = data.length > 10 ? 2 : 1;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${short(t)}</text>`).join("")}</g>
    ${data.map((d, i) => {
      const x = L + i * bw + (bw - barW) / 2, top = y(d.v), h = H - B - top, r = Math.min(4, h);
      const path = h > 0 ? `M${x},${H - B} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - B} Z` : "";
      return `<rect class="hit" x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" data-tip="<b>${esc(d.label)}</b>${rp(d.v)} · ${d.n} orders"/>
        <path class="bar" d="${path}"/>
        ${i % labelEvery === 0 ? `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.tick)}</text>` : ""}`;
    }).join("")}
  </svg></div>
  <details style="margin-top:8px"><summary class="muted" style="cursor:pointer;font-size:.85rem">View as table</summary>
    <table style="margin-top:8px"><tbody>${data.map((d) => `<tr><td>${esc(d.label)}</td><td class="num">${d.n} orders</td><td class="num">${rp(d.v)}</td></tr>`).join("")}</tbody></table></details>`;
}

function hbars(rows, fmt) {
  const max = Math.max(...rows.map((r) => r.v), 1);
  return `<div class="hbars">${rows.map((r) => `<div class="hbar" data-tip="<b>${esc(r.name)}</b>${fmt(r.v)}">
    <span class="name">${esc(r.name)}</span><div class="track"><div class="fill" style="width:${(r.v / max) * 100}%"></div></div><span class="num">${fmt(r.v)}</span></div>`).join("") || `<p class="muted">No sales yet.</p>`}</div>`;
}

function stackBar(rows, colors) {
  const total = rows.reduce((a, r) => a + r.v, 0) || 1;
  return `<div class="stack">${rows.filter((r) => r.v).map((r) => `<div style="flex:${r.v};background:${colors[r.name]}" data-tip="<b>${esc(r.name)}</b>${r.v} orders · ${Math.round((r.v / total) * 100)}%"></div>`).join("")}</div>
    <div class="legend">${rows.map((r) => `<div><i style="background:${colors[r.name]}"></i><span>${esc(r.name)}</span><span>${r.v} · ${Math.round((r.v / total) * 100)}%</span></div>`).join("")}</div>`;
}

function banner() {
  const orders = Kafe.orders();
  const sample = orders.some((o) => o.sample);
  if (sample) return `<div class="banner"><span><b>You're looking at sample data.</b> A made-up week of sales so you can see everything the back office does. Real sales from the POS are added on top.</span>
    <span class="actions"><button class="pill" data-act="clear-sample">Clear sample data</button></span></div>`;
  if (!orders.length) return `<div class="banner"><span><b>No sales yet.</b> Ring something up on the POS, or load a sample week to explore.</span>
    <span class="actions"><button class="pill solid" data-act="load-sample">Load sample week</button><a class="pill" href="pos.html" style="text-decoration:none">Open POS</a></span></div>`;
  return "";
}

// ───────── pages ─────────
const pages = {
  overview() {
    const { cur, prev, prevLabel } = periodOrders(range);
    const s = stats(cur), p = stats(prev);
    let series;
    if (range === "today") {
      series = Array.from({ length: 15 }, (_, i) => i + 7).map((h) => {
        const os = cur.filter((o) => new Date(o.at).getHours() === h);
        return { tick: `${h}`, label: `${String(h).padStart(2, "0")}:00–${String(h + 1).padStart(2, "0")}:00`, v: os.reduce((a, o) => a + o.subtotal, 0), n: os.length };
      });
    } else {
      series = Array.from({ length: 7 }, (_, i) => startOf(6 - i)).map((d) => {
        const os = cur.filter((o) => dayKey(o.at) === dayKey(d));
        return { tick: d.toLocaleDateString("en-GB", { weekday: "short" }), label: fmtDate(d), v: os.reduce((a, o) => a + o.subtotal, 0), n: os.length };
      });
    }
    const itemQty = {}, catNet = {};
    cur.forEach((o) => o.lines.forEach((l) => { itemQty[l.name] = (itemQty[l.name] || 0) + l.qty; const c = Kafe.catName(l.cat); catNet[c] = (catNet[c] || 0) + l.unit * l.qty; }));
    const top = Object.entries(itemQty).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v).slice(0, 6);
    const cats = Object.entries(catNet).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v);
    const count = (key, vals) => vals.map((name) => ({ name, v: cur.filter((o) => o[key] === name).length }));

    return `
      <div class="page-head"><div><h1>Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} ☕</h1>
        <p>${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div class="seg" role="group" aria-label="Date range"><button data-range="today" class="${range === "today" ? "on" : ""}">Today</button><button data-range="7d" class="${range === "7d" ? "on" : ""}">Last 7 days</button></div></div>
      ${banner()}
      <p class="features-title">What's included with Kafe POS</p>
      <div class="features">
        <a class="feature" href="pos.html"><b>Counter POS</b><span>Tap-to-order menu, drink options, dine-in or takeaway, cash change, QRIS &amp; card.</span></a>
        <a class="feature" href="#overview"><b>Live sales dashboard</b><span>Sales, orders, average order and best sellers — today or the last 7 days.</span></a>
        <a class="feature" href="#orders"><b>Order history</b><span>Every receipt, searchable and filterable, with CSV export for your accountant.</span></a>
        <a class="feature" href="#menu"><b>Menu control</b><span>Change prices, add items, or mark something sold out — the counter updates instantly.</span></a>
        <a class="feature" href="#settings"><b>Tax &amp; receipts</b><span>Set your tax rate, address and the thank-you line printed on every receipt.</span></a>
      </div>
      <div class="kpis">
        <div class="card kpi"><span class="label">Net sales</span><div class="val">${rp(s.net)}</div>${delta(s.net, p.net)} <span class="delta">${prevLabel}</span></div>
        <div class="card kpi"><span class="label">Orders</span><div class="val">${s.count}</div>${delta(s.count, p.count)}</div>
        <div class="card kpi"><span class="label">Average order</span><div class="val">${rp(s.avg)}</div>${delta(s.avg, p.avg)}</div>
        <div class="card kpi"><span class="label">Items sold</span><div class="val">${s.items}</div>${delta(s.items, p.items)}</div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Net sales ${range === "today" ? "by hour" : "by day"}</h3><p class="hint">Before tax. Hover a bar for details.</p>${barChart(series, "Net sales chart")}</div>
        <div class="card"><h3>Best sellers</h3><p class="hint">Cups and pieces sold</p>${hbars(top, (v) => `${v}`)}</div>
      </div>
      <div class="grid3">
        <div class="card"><h3>Sales by category</h3><p class="hint">Net sales</p>${hbars(cats, short)}</div>
        <div class="card"><h3>How people pay</h3><p class="hint">Share of orders</p>${stackBar(count("method", ["Cash", "QRIS", "Card"]), METHOD_COLOR)}</div>
        <div class="card"><h3>Dine in vs takeaway</h3><p class="hint">Share of orders</p>${stackBar(count("type", ["Dine in", "Takeaway"]), TYPE_COLOR)}</div>
      </div>`;
  },

  orders() {
    return `
      <div class="page-head"><div><h1>Orders</h1><p>Every sale rung up on the POS. Click a row to see the receipt.</p></div>
        <button class="btn btn-brick" data-act="csv">Export CSV</button></div>
      ${banner()}
      <div class="toolbar">
        <input type="search" id="o-q" placeholder="Search order # or item…" aria-label="Search orders">
        <select id="o-when" aria-label="Date"><option value="today">Today</option><option value="7d" selected>Last 7 days</option><option value="all">All time</option></select>
        <select id="o-method" aria-label="Payment"><option value="">All payments</option><option>Cash</option><option>QRIS</option><option>Card</option></select>
        <select id="o-type" aria-label="Order type"><option value="">Dine in &amp; takeaway</option><option>Dine in</option><option>Takeaway</option></select>
      </div>
      <p class="muted" id="o-count" style="margin-bottom:10px;font-size:.9rem"></p>
      <div class="table-wrap"><table><thead><tr><th>Order</th><th>When</th><th>Type</th><th>Items</th><th>Payment</th><th class="num">Total</th></tr></thead><tbody id="o-body"></tbody></table></div>`;
  },

  menu() {
    return `
      <div class="page-head"><div><h1>Menu</h1><p>Edits save automatically and show up on the POS straight away.</p></div>
        <button class="btn btn-brick" data-act="add-item">+ Add item</button></div>
      <div class="toolbar">
        <input type="search" id="m-q" placeholder="Search menu…" aria-label="Search menu">
        <select id="m-cat" aria-label="Category"><option value="">All categories</option>${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
      </div>
      <div class="table-wrap"><table><thead><tr><th>On sale</th><th>Item</th><th>Category</th><th>Description</th><th class="num">Price (Rp)</th><th class="num">Sold, 7 days</th><th><span class="sr-only">Delete</span></th></tr></thead><tbody id="m-body"></tbody></table></div>`;
  },

  settings() {
    const s = Kafe.settings();
    return `
      <div class="page-head"><div><h1>Settings</h1><p>Applies to new orders on the POS.</p></div></div>
      <form id="settings-form" class="settings">
        <div class="card"><h3>Receipt</h3><p class="hint">Printed at the top and bottom of every receipt.</p>
          <div class="form">
            <label class="field full"><span>Address</span><input name="address" value="${esc(s.address)}"></label>
            <label class="field full"><span>Thank-you line</span><input name="footer" value="${esc(s.footer)}"></label>
          </div></div>
        <div class="card"><h3>Tax</h3><p class="hint">Added on top of menu prices at checkout.</p>
          <div class="form">
            <label class="field"><span>Tax name</span><input name="taxLabel" value="${esc(s.taxLabel)}"></label>
            <label class="field"><span>Rate (%)</span><input name="taxRate" type="number" min="0" max="30" step="0.5" value="${s.taxRate}"></label>
          </div></div>
        <div style="grid-column:1/-1;display:flex;gap:12px;align-items:center"><button class="btn btn-brick" type="submit">Save settings</button><span class="saved" id="saved">✓ Saved</span></div>
      </form>
      <div class="card" style="margin-top:14px"><h3>Data</h3><p class="hint">Everything is stored in this browser only. Nothing is sent to a server.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-ghost-dark" data-act="load-sample">Load sample week</button>
          <button class="btn btn-ghost-dark" data-act="clear-sample">Clear sample data</button>
          <button class="btn btn-ghost-dark" data-act="reset-menu">Reset menu to default</button>
          <button class="btn danger" data-act="clear-all">Delete all orders</button>
        </div></div>`;
  },
};

// ───────── table renderers ─────────
function renderOrders() {
  const q = ($("#o-q").value || "").toLowerCase().trim();
  const when = $("#o-when").value, method = $("#o-method").value, type = $("#o-type").value;
  const from = when === "today" ? startOf(0) : when === "7d" ? startOf(6) : new Date(0);
  const rows = Kafe.orders().filter((o) => new Date(o.at) >= from && (!method || o.method === method) && (!type || o.type === type) &&
    (!q || String(o.no).includes(q.replace("#", "")) || o.lines.some((l) => l.name.toLowerCase().includes(q))))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  $("#o-count").textContent = `${rows.length} order${rows.length === 1 ? "" : "s"} · ${rp(rows.reduce((a, o) => a + o.total, 0))} incl. tax`;
  const shown = rows.slice(0, 200);
  $("#o-body").innerHTML = shown.map((o) => `<tr class="click" data-order="${o.no}" tabindex="0">
      <td><b>#${String(o.no).padStart(3, "0")}</b>${o.sample ? ` <span class="muted" style="font-size:.75rem">sample</span>` : ""}</td>
      <td>${fmtDate(o.at)}, ${fmtTime(o.at)}</td><td>${o.type}</td>
      <td class="muted">${esc(o.lines.map((l) => `${l.qty}× ${l.name}`).join(", "))}</td>
      <td><span class="badge"><i style="background:${METHOD_COLOR[o.method]}"></i>${o.method}</span></td>
      <td class="num">${rp(o.total)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty-row">No orders match.</td></tr>`;
  if (rows.length > 200) $("#o-body").insertAdjacentHTML("beforeend", `<tr><td colspan="6" class="empty-row">Showing the latest 200 — export CSV for everything.</td></tr>`);
}

function openOrder(no) {
  const o = Kafe.orders().find((x) => x.no === no);
  const s = Kafe.settings();
  const dlg = $("#order-dlg");
  dlg.innerHTML = `<div class="dlg-head"><div><h3>Order #${String(o.no).padStart(3, "0")}</h3><p>${fmtDate(o.at)}, ${fmtTime(o.at)} · ${o.type} · ${o.method}</p></div><button data-close aria-label="Close">×</button></div>
    <div class="dlg-body"><ul>${o.lines.map((l) => {
      const extra = Object.values(l.opts || {}).filter((v) => !["Normal", "Regular", "Whole", "No", "As is"].includes(v));
      if (l.note) extra.push(`“${l.note}”`);
      return `<li><span>${l.qty}× ${esc(l.name)}${extra.length ? `<small>${esc(extra.join(" · "))}</small>` : ""}</span><span>${rp(l.unit * l.qty)}</span></li>`;
    }).join("")}</ul>
    <div class="sumgrid"><span>Subtotal</span><span>${rp(o.subtotal)}</span><span>Tax</span><span>${rp(o.tax)}</span><b>Total</b><b>${rp(o.total)}</b>
      <span class="muted">Paid (${o.method})</span><span class="muted">${rp(o.paid)}</span>${o.method === "Cash" ? `<span class="muted">Change</span><span class="muted">${rp(o.paid - o.total)}</span>` : ""}</div></div>`;
  dlg.showModal();
}

function renderMenu() {
  const q = ($("#m-q").value || "").toLowerCase().trim(), cat = $("#m-cat").value;
  const sold = {};
  inRange(Kafe.orders(), startOf(6), startOf(-1)).forEach((o) => o.lines.forEach((l) => { sold[l.id] = (sold[l.id] || 0) + l.qty; }));
  const menu = Kafe.menu();
  $("#m-body").innerHTML = menu.map((m, i) => ({ m, i })).filter(({ m }) => (!cat || m.cat === cat) && (!q || m.name.toLowerCase().includes(q)))
    .map(({ m, i }) => `<tr data-i="${i}">
      <td><label class="switch"><input type="checkbox" data-f="available" ${m.available ? "checked" : ""} aria-label="${esc(m.name)} on sale"><span></span></label></td>
      <td><input data-f="name" value="${esc(m.name)}" aria-label="Name" style="font-family:var(--font-display);font-weight:600;min-width:140px"></td>
      <td><select data-f="cat" aria-label="Category" style="border:0;background:transparent">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === m.cat ? "selected" : ""}>${c.name}</option>`).join("")}</select></td>
      <td><input data-f="desc" value="${esc(m.desc)}" aria-label="Description" class="muted" style="min-width:180px"></td>
      <td class="num"><input class="price" data-f="price" type="number" min="0" step="1000" value="${m.price}" aria-label="Price"></td>
      <td class="num">${sold[m.id] || 0}</td>
      <td><button class="icon-btn" data-del="${i}" aria-label="Delete ${esc(m.name)}">✕</button></td></tr>`).join("") ||
    `<tr><td colspan="7" class="empty-row">No items.</td></tr>`;
}

function openAddItem() {
  const dlg = $("#item-dlg");
  dlg.innerHTML = `<form method="dialog" id="item-form"><div class="dlg-head"><div><h3>New menu item</h3><p>It appears on the POS as soon as you save.</p></div><button type="button" data-close aria-label="Close">×</button></div>
    <div class="dlg-body form">
      <label class="field full"><span>Name</span><input name="name" required placeholder="e.g. Pandan Latte"></label>
      <label class="field"><span>Category</span><select name="cat">${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label>
      <label class="field"><span>Price (Rp)</span><input name="price" type="number" min="0" step="1000" required placeholder="35000"></label>
      <label class="field full"><span>Short description</span><input name="desc" placeholder="One line the cashier sees"></label>
      <div class="field full"><span>Options at the counter</span><div class="checks">${Object.entries(OPT).map(([k, o]) => `<label><input type="checkbox" name="opts" value="${k}">${o.name}</label>`).join("")}</div></div>
    </div>
    <div class="dlg-foot"><button type="button" class="btn btn-ghost-dark" data-close>Cancel</button><button class="btn btn-brick" type="submit">Add to menu</button></div></form>`;
  dlg.showModal();
  $("#item-form").addEventListener("submit", (e) => {
    const f = new FormData(e.target);
    const menu = Kafe.menu();
    menu.push({ id: "i" + Date.now().toString(36), cat: f.get("cat"), name: f.get("name").trim(), desc: f.get("desc").trim(), price: Number(f.get("price")), opts: f.getAll("opts"), available: true });
    Kafe.saveMenu(menu); renderMenu();
  });
}

function exportCsv() {
  const rows = [["order", "date", "time", "type", "payment", "items", "subtotal", "tax", "total", "sample"]];
  Kafe.orders().forEach((o) => rows.push([o.no, dayKey(o.at), fmtTime(o.at), o.type, o.method, o.lines.map((l) => `${l.qty}x ${l.name}`).join("; "), o.subtotal, o.tax, o.total, o.sample ? "yes" : "no"]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `kafe-orders-${dayKey(new Date())}.csv`;
  a.click();
}

// ───────── router ─────────
function route() {
  const page = (location.hash.slice(1) || "overview");
  const p = pages[page] ? page : "overview";
  document.querySelectorAll(".side a.nav[href^='#']").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + p));
  $("#app").innerHTML = pages[p]();
  document.title = `${p[0].toUpperCase() + p.slice(1)} · Kafe Back Office`;
  if (p === "orders") { ["o-q", "o-when", "o-method", "o-type"].forEach((id) => $("#" + id).addEventListener("input", renderOrders)); renderOrders(); }
  if (p === "menu") { ["m-q", "m-cat"].forEach((id) => $("#" + id).addEventListener("input", renderMenu)); renderMenu(); }
  if (p === "settings") $("#settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    f.taxRate = Math.max(0, Number(f.taxRate) || 0);
    Kafe.saveSettings({ ...Kafe.settings(), ...f });
    $("#saved").classList.add("show"); setTimeout(() => $("#saved")?.classList.remove("show"), 1500);
  });
}
window.addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
window.addEventListener("storage", (e) => { if (e.key?.startsWith("kafe.") && !document.querySelector("dialog[open]") && !document.activeElement.matches("input, select")) route(); });

// ───────── events ─────────
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-range], [data-act], [data-order], [data-del], [data-close]");
  if (!t) return;
  if (t.dataset.range) { range = t.dataset.range; KafeStore.set("kafe.bo.range", range); route(); }
  else if (t.dataset.order) openOrder(+t.dataset.order);
  else if (t.dataset.del) {
    const menu = Kafe.menu(); const m = menu[+t.dataset.del];
    if (confirm(`Remove “${m.name}” from the menu?`)) { menu.splice(+t.dataset.del, 1); Kafe.saveMenu(menu); renderMenu(); }
  }
  else if (t.hasAttribute("data-close")) t.closest("dialog").close();
  else switch (t.dataset.act) {
    case "load-sample": // merge, then renumber by time so order numbers stay unique
      Kafe.saveOrders([...Kafe.orders().filter((o) => !o.sample), ...Kafe.sampleOrders()]
        .sort((a, b) => new Date(a.at) - new Date(b.at)).map((o, i) => ({ ...o, no: i + 1 }))); route(); break;
    case "clear-sample": Kafe.saveOrders(Kafe.orders().filter((o) => !o.sample)); route(); break;
    case "clear-all": if (confirm("Delete every order, including real ones? This can't be undone.")) { Kafe.saveOrders([]); route(); } break;
    case "reset-menu": if (confirm("Reset the menu to the original 20 items? Your edits will be lost.")) { KafeStore.del("kafe.menu"); route(); } break;
    case "add-item": openAddItem(); break;
    case "csv": exportCsv(); break;
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.dataset.order) openOrder(+e.target.dataset.order); });

// Inline menu edits
document.addEventListener("change", (e) => {
  const f = e.target.dataset.f; const tr = e.target.closest("tr[data-i]");
  if (!f || !tr) return;
  const menu = Kafe.menu(); const m = menu[+tr.dataset.i];
  m[f] = f === "available" ? e.target.checked : f === "price" ? Math.max(0, Number(e.target.value) || 0) : e.target.value;
  Kafe.saveMenu(menu);
});

// Tooltip
const tip = $("#tip");
document.addEventListener("mousemove", (e) => {
  const t = e.target.closest("[data-tip]");
  if (!t) return tip.classList.remove("show");
  tip.innerHTML = t.dataset.tip;
  tip.classList.add("show");
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
  tip.style.left = x + "px"; tip.style.top = e.clientY - tip.offsetHeight - 12 + "px";
  document.querySelectorAll(".bar.hl").forEach((b) => b.classList.remove("hl"));
  if (t.classList.contains("hit")) t.nextElementSibling.classList.add("hl");
});

// First visit: seed a sample week so there's something to look at.
if (!KafeStore.get("kafe.seeded", false) && !Kafe.orders().length) { Kafe.saveOrders(Kafe.sampleOrders()); KafeStore.set("kafe.seeded", true); }
route();
