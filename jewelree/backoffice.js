// Jewelree back office. Reads the same localStorage as the storefront, so orders placed
// at checkout.html show up here, and price/stock edits show up in the store.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = JW.esc, rp = JW.rp, rpShort = JW.rpShort;
const STATUSES = ["Menunggu bayar", "Dibayar", "Dikemas", "Dikirim", "Selesai"];
const STATUS_COLOR = { "Menunggu bayar": "#8f8676", Dibayar: "#C9A46A", Dikemas: "#B87333", Dikirim: "#1E3A5F", Selesai: "#3F6B4A", Dibatalkan: "#9B2C2C" };
const SRC_COLOR = { "Google organik": "var(--c1)", Instagram: "var(--c2)", Langsung: "var(--c3)", "Meta Ads": "var(--c4)", Journal: "var(--c5)", WhatsApp: "var(--c6)" };
const TIER_COLOR = { ivory: "#C9A46A", copper: "#B87333", ink: "#1E3A5F" };
const ART_KINDS = [["ring", "Cincin pahat"], ["band", "Cincin band"], ["signet", "Signet"], ["pendant", "Liontin"], ["pearlPendant", "Liontin mutiara"], ["cuff", "Gelang tebal"], ["cuffThin", "Gelang tipis"], ["earrings", "Anting drop"], ["hoops", "Anting hoop"]];
const PAGE_TITLES = { dasbor: "Dasbor", pesanan: "Pesanan", produk: "Produk", member: "Member", sertifikat: "Sertifikat", journal: "Journal & SEO", pengaturan: "Pengaturan" };
const DAY = 864e5;

const dayKey = (d) => new Date(d).toLocaleDateString("en-CA");
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const num = (n) => Math.round(n).toLocaleString("id-ID");
const pct = (n, d = 1) => (n * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const short = (n) => n >= 1e9 ? (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M" : n >= 1e6 ? (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt" : n >= 1e3 ? Math.round(n / 1e3) + "rb" : String(Math.round(n));
const startOf = (daysAgo) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - daysAgo); return d; };
const isPaid = (o) => o.status !== "Menunggu bayar" && o.status !== "Dibatalkan";
const words = (s) => (String(s).trim().match(/\S+/g) || []).length;
const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DEFAULT_SETTINGS = {
  storeName: "Jewelree Atelier", whatsapp: "0812 3456 7890", email: "atelier@jewelree.id", address: "Jl. Kemang Raya 18, Jakarta Selatan",
  shipping: { reg: true, same: true, pickup: true },
  payments: { qris: true, va: true, card: true, cicilan: true },
  tiers: { copper: TIERS[1].min, ink: TIERS[2].min },
};
const settings = () => { const s = JStore.get("jewelree.settings", {}); return { ...DEFAULT_SETTINGS, ...s, shipping: { ...DEFAULT_SETTINGS.shipping, ...s.shipping }, payments: { ...DEFAULT_SETTINGS.payments, ...s.payments }, tiers: { ...DEFAULT_SETTINGS.tiers, ...s.tiers } }; };

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200); }
function delta(cur, prev, label = "vs. 7 hari sebelumnya") {
  if (!prev) return `<span class="delta"><em>${label}</em></span>`;
  const p = ((cur - prev) / prev) * 100;
  const cls = p >= 0.5 ? "up" : p <= -0.5 ? "down" : "";
  return `<span class="delta ${cls}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(0)}% <em>${label}</em></span>`;
}
const art = (p) => Art.svg(p?.art || "ring", p?.bg || "stone");
const productName = (id) => JW.product(id)?.name || id;

// ───────── charts (inline SVG) ─────────
function niceMax(max) {
  if (max <= 0) return 1;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / step) * step;
}

// Area + line chart for one series over days.
function areaChart(data, { label, fmt = short, color = "var(--c1)", tip }) {
  const W = 680, H = 230, L = 46, R = 8, T = 12, B = 26;
  const max = niceMax(Math.max(...data.map((d) => d.v)));
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const pts = data.map((d, i) => [x(i), y(d.v)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
  const area = line + `L${x(data.length - 1)},${H - B}L${L},${H - B}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.ceil(data.length / 8);
  const colW = (W - L - R) / Math.max(1, data.length - 1);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3A5F" stop-opacity=".22"/><stop offset="1" stop-color="#1E3A5F" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${ticks.map((t, i) => `<line class="${i ? "" : "base"}" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 3.5}" text-anchor="end">${fmt(t)}</text>`).join("")}</g>
    <path d="${area}" fill="url(#areaG)"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${data.map((d, i) => `<g class="col"><rect class="hit" x="${x(i) - colW / 2}" y="${T}" width="${colW}" height="${H - T - B}" data-tip="${esc(tip(d))}"/>
      <line class="dot" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" stroke="#C9A46A" stroke-dasharray="2 3"/>
      <circle class="dot" cx="${x(i)}" cy="${y(d.v)}" r="4" fill="#fff" stroke="${color}" stroke-width="2"/></g>`).join("")}
    ${data.map((d, i) => i % every === (data.length - 1) % every ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(d.tick)}</text>` : "").join("")}
  </svg></div>`;
}

// Stacked bars per day, one segment per series.
function stackChart(days, keys, colors, label) {
  const W = 680, H = 220, L = 40, R = 4, T = 10, B = 26;
  const max = niceMax(Math.max(...days.map((d) => keys.reduce((a, k) => a + (d.v[k] || 0), 0))));
  const bw = (W - L - R) / days.length, barW = Math.max(3, bw - 4);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const every = Math.ceil(days.length / 8);
  return `<div class="legend-row">${keys.map((k) => `<span><i style="background:${colors[k]}"></i>${esc(k)}</span>`).join("")}</div>
  <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <g class="grid">${ticks.map((t, i) => `<line class="${i ? "" : "base"}" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 3.5}" text-anchor="end">${short(t)}</text>`).join("")}</g>
    ${days.map((d, i) => {
      let acc = 0; const bx = L + i * bw + (bw - barW) / 2;
      const total = keys.reduce((a, k) => a + (d.v[k] || 0), 0);
      const segs = keys.map((k) => { const v = d.v[k] || 0; const y1 = y(acc), y2 = y(acc + v); acc += v; return `<rect x="${bx}" y="${y2}" width="${barW}" height="${Math.max(0, y1 - y2 - (v ? 0.6 : 0))}" fill="${colors[k]}"/>`; }).join("");
      const tipTxt = `<b>${esc(d.label)}</b>${num(total)} sesi<br>` + keys.map((k) => `${esc(k)}: ${num(d.v[k] || 0)}`).join("<br>");
      return `<g>${segs}<rect class="hit" x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" data-tip="${esc(tipTxt)}"/>${i % every === (days.length - 1) % every ? `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.tick)}</text>` : ""}</g>`;
    }).join("")}
  </svg></div>`;
}

function ranks(rows, fmt, colorFor) {
  const max = Math.max(...rows.map((r) => r.v), 1);
  return `<div class="ranks">${rows.map((r) => `<div class="rank" data-tip="${esc(`<b>${esc(r.name)}</b>${fmt(r.v)}${r.sub ? " · " + r.sub : ""}`)}">
    <i style="background:${colorFor(r)}"></i><span class="name">${esc(r.name)}</span><span class="num"><b>${fmt(r.v)}</b>${r.sub ? " · " + r.sub : ""}</span>
    <div class="track"><div class="fill" style="width:${(r.v / max) * 100}%;background:${colorFor(r)}"></div></div></div>`).join("") || `<p class="muted">Belum ada data.</p>`}</div>`;
}

// Pseudo QR placeholder generated from the code, so each card looks distinct.
function qrSvg(code) {
  const N = 25; let h = 2166136261;
  for (const c of code) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const finder = (x, y) => (x >= 0 && x < 7 && y >= 0 && y < 7);
  const inFinder = (x, y) => finder(x, y) || finder(x - (N - 7), y) || finder(x, y - (N - 7));
  let cells = "";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inFinder(x, y) || (x === 7 || y === 7 || x === N - 8 || y === N - 8) && (x < 8 || x > N - 9) && (y < 8 || y > N - 9)) continue;
    if (rnd() < 0.48) cells += `M${x},${y}h1v1h-1z`;
  }
  const fp = (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" fill="none" stroke="#1A1A1A"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1A1A1A"/>`;
  return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" role="img" aria-label="Kode QR untuk ${esc(code)}"><path d="${cells}" fill="#1A1A1A"/>${fp(0, 0)}${fp(N - 7, 0)}${fp(0, N - 7)}</svg>`;
}

// ───────── shared data shaping ─────────
function last30() {
  const orders = JW.orders();
  const from = startOf(29), to = startOf(-1);
  const inWin = orders.filter((o) => { const t = new Date(o.at); return t >= from && t < to; });
  return { orders, inWin, paid: inWin.filter(isPaid) };
}
function dailyRevenue(paid) {
  const by = {};
  paid.forEach((o) => { const k = dayKey(o.at); (by[k] ||= { v: 0, n: 0 }); by[k].v += o.total; by[k].n++; });
  return Array.from({ length: 30 }, (_, i) => startOf(29 - i)).map((d) => { const k = dayKey(d); return { tick: fmtDay(d), label: d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }), v: by[k]?.v || 0, n: by[k]?.n || 0 }; });
}
function trafficDays() {
  return JW.traffic().map((t) => ({ tick: fmtDay(t.date + "T12:00"), label: new Date(t.date + "T12:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }), v: t.sessions, total: t.total }));
}
function sourceTotals() {
  const tot = {}; JW.SOURCES.forEach((s) => (tot[s] = 0));
  JW.traffic().forEach((t) => JW.SOURCES.forEach((s) => (tot[s] += t.sessions[s] || 0)));
  return tot;
}

function banner() {
  return `<div class="banner"><div><b>Data contoh.</b><span>Pesanan, member, dan traffic 30 hari ini dikarang dan hanya tersimpan di browser ini. Pesanan baru dari checkout toko ikut masuk di sini.</span></div>
    <div class="actions"><button class="btn btn-sm btn-line" data-act="reset">Reset demo</button><a class="btn btn-sm btn-gold" href="index.html" target="_blank" rel="noopener">Buka toko ↗</a></div></div>`;
}
function head(eyebrow, title, desc, actions = "") {
  return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}</div>${actions ? `<div class="actions">${actions}</div>` : ""}</div>`;
}
function statusBadge(s) { return `<span class="badge"><i style="background:${STATUS_COLOR[s] || "#999"}"></i>${esc(s)}</span>`; }
function tierBadge(t) { return `<span class="badge tier-${t.id}">${esc(t.name)}</span>`; }

// ───────── pages ─────────
const pages = {};

pages.dasbor = () => {
  const { inWin, paid } = last30();
  const revenue = paid.reduce((a, o) => a + o.total, 0);
  const traffic = JW.traffic(); const sessions = traffic.reduce((a, t) => a + t.total, 0);
  const members = JW.members();
  const newMembers = members.filter((m) => m.joined && new Date(m.joined + "T12:00") >= startOf(29)).length;
  const conv = sessions ? inWin.length / sessions : 0;
  // Week-on-week deltas
  const wk = (a, b) => paid.filter((o) => { const t = new Date(o.at); return t >= startOf(a) && t < startOf(b); });
  const cw = wk(6, -1), pw = wk(13, 6);
  const sum = (os) => os.reduce((a, o) => a + o.total, 0);
  const sess = (a, b) => traffic.slice(traffic.length - a, traffic.length - b).reduce((s, t) => s + t.total, 0);
  const cwAll = inWin.filter((o) => new Date(o.at) >= startOf(6)).length, pwAll = inWin.filter((o) => { const t = new Date(o.at); return t >= startOf(13) && t < startOf(6); }).length;
  const convCw = sess(7, 0) ? cwAll / sess(7, 0) : 0, convPw = sess(14, 7) ? pwAll / sess(14, 7) : 0;

  const series = dailyRevenue(paid);
  const tot = sourceTotals();
  const srcRows = JW.SOURCES.map((s) => ({ name: s, v: tot[s], sub: sessions ? pct(tot[s] / sessions, 0) : "" })).sort((a, b) => b.v - a.v);
  const ordersBySrc = {}; inWin.forEach((o) => (ordersBySrc[o.source] = (ordersBySrc[o.source] || 0) + 1));

  const sold = {};
  paid.forEach((o) => o.items.forEach((l) => { (sold[l.id] ||= { q: 0, v: 0, name: l.name }); sold[l.id].q += l.qty; sold[l.id].v += l.price * l.qty; }));
  const top = Object.entries(sold).sort((a, b) => b[1].v - a[1].v).slice(0, 5);
  const toShip = JW.orders().filter((o) => o.status === "Dibayar" || o.status === "Dikemas").sort((a, b) => new Date(a.at) - new Date(b.at));
  const h = new Date().getHours();

  return `${head(new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), `Selamat ${h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam"}, Atelier`, "")}
    ${banner()}
    <div class="kpis">
      <div class="card kpi"><span class="eyebrow">Omzet · 30 hari</span><div class="val">${rpShort(revenue)}</div>${delta(sum(cw), sum(pw), "minggu ini")}</div>
      <div class="card kpi"><span class="eyebrow">Pesanan</span><div class="val">${num(inWin.length)}</div>${delta(cwAll, pwAll, "minggu ini")}</div>
      <div class="card kpi"><span class="eyebrow">Rata-rata pesanan</span><div class="val">${rpShort(paid.length ? revenue / paid.length : 0)}</div>${delta(cw.length ? sum(cw) / cw.length : 0, pw.length ? sum(pw) / pw.length : 0, "minggu ini")}</div>
      <div class="card kpi"><span class="eyebrow">Konversi</span><div class="val">${pct(conv, 2)}</div>${delta(convCw, convPw, "minggu ini")}</div>
      <div class="card kpi"><span class="eyebrow">Member baru</span><div class="val">${num(newMembers)}</div><span class="delta"><em>${num(members.length)} member total</em></span></div>
    </div>
    <div class="grid2">
      <div class="card"><div class="card-head"><div><h3>Omzet per hari</h3><p class="hint">Pesanan yang sudah dibayar, 30 hari terakhir.</p></div><a href="#pesanan">Semua pesanan →</a></div>
        <div class="legend-row"><span><i class="line" style="background:var(--c1)"></i>Omzet (Rp)</span></div>
        ${areaChart(series, { label: "Omzet per hari", tip: (d) => `<b>${esc(d.label)}</b>${rp(d.v)} · ${d.n} pesanan` })}</div>
      <div class="card"><div class="card-head"><div><h3>Sesi per sumber</h3><p class="hint">Dari mana pengunjung datang · 30 hari</p></div><a href="#journal">Analytics →</a></div>
        ${ranks(srcRows.map((r) => ({ ...r, sub: `${r.sub} · ${ordersBySrc[r.name] || 0} pesanan` })), num, (r) => SRC_COLOR[r.name])}</div>
    </div>
    <div class="grid2 even">
      <div class="card"><div class="card-head"><div><h3>Produk terlaris</h3><p class="hint">Berdasarkan omzet · 30 hari</p></div><a href="#produk">Produk →</a></div>
        <ul class="list">${top.map(([id, s], i) => { const p = JW.product(id); return `<li><span class="rankno">${i + 1}</span><span class="thumb">${art(p)}</span><div><div class="t">${esc(s.name)}</div><small>${s.q} terjual · stok ${p ? p.stock : "—"}</small></div><div class="r">${rpShort(s.v)}</div></li>`; }).join("") || `<li class="muted">Belum ada penjualan.</li>`}</ul></div>
      <div class="card"><div class="card-head"><div><h3>Perlu dikirim</h3><p class="hint">${toShip.length} pesanan sudah dibayar, belum dikirim</p></div><a href="#pesanan">Kelola →</a></div>
        <ul class="list">${toShip.slice(0, 5).map((o) => `<li class="click" data-order="${esc(o.no)}"><div><div class="t">${esc(o.no)} · ${esc(o.customer.name)}</div><small>${esc(o.items.map((l) => l.name).join(", "))} · ${esc(o.shipName)}</small></div><div class="r">${statusBadge(o.status)}<small>${fmtDay(o.at)}</small></div></li>`).join("") || `<li class="muted">Semua pesanan sudah dikirim.</li>`}</ul></div>
    </div>`;
};

let orderFilter = "Semua", orderQuery = "";
pages.pesanan = () => {
  const orders = JW.orders();
  const counts = {}; orders.forEach((o) => (counts[o.status] = (counts[o.status] || 0) + 1));
  const chips = ["Semua", ...STATUSES, "Dibatalkan"];
  return `${head("Penjualan", "Pesanan", "Semua pesanan dari toko online. Klik baris untuk detail, ubah status, isi resi, dan terbitkan sertifikat keaslian.", `<button class="btn btn-line" data-act="csv">Export CSV</button>`)}
    <div class="toolbar">
      <input class="inp search" type="search" id="o-q" placeholder="Cari no. pesanan atau nama…" aria-label="Cari pesanan" value="${esc(orderQuery)}">
      <div class="chips" role="group" aria-label="Filter status">${chips.map((c) => `<button class="chip ${orderFilter === c ? "on" : ""}" data-chip="${esc(c)}">${esc(c)}<b>${c === "Semua" ? orders.length : counts[c] || 0}</b></button>`).join("")}</div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Pesanan</th><th>Tanggal</th><th>Pelanggan</th><th>Item</th><th>Bayar</th><th>Status</th><th class="num">Total</th></tr></thead><tbody id="o-body"></tbody></table><div class="tfoot-note" id="o-note"></div></div>`;
};
function renderOrders() {
  const q = orderQuery.toLowerCase().trim();
  const rows = JW.orders().filter((o) => (orderFilter === "Semua" || o.status === orderFilter) && (!q || o.no.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  $("#o-body").innerHTML = rows.slice(0, 150).map((o) => `<tr class="click" data-order="${esc(o.no)}" tabindex="0">
    <td class="nowrap"><b>${esc(o.no)}</b>${o.memberId ? ` <span class="badge" title="Member">M</span>` : ""}</td>
    <td class="nowrap">${fmtDay(o.at)}, ${fmtTime(o.at)}</td>
    <td class="nowrap">${esc(o.customer.name)}<br><small class="muted">${esc(o.customer.city || "")}</small></td>
    <td class="muted" style="min-width:180px">${esc(o.items.map((l) => `${l.qty}× ${l.name}`).join(", "))}</td>
    <td class="nowrap muted">${esc(o.payment)}</td>
    <td>${statusBadge(o.status)}</td>
    <td class="num nowrap">${rp(o.total)}</td></tr>`).join("") || `<tr><td colspan="7" class="empty-row">Tidak ada pesanan yang cocok.</td></tr>`;
  $("#o-note").textContent = `${rows.length} pesanan · ${rp(rows.filter(isPaid).reduce((a, o) => a + o.total, 0))} sudah dibayar${rows.length > 150 ? " · menampilkan 150 terbaru" : ""}`;
}

function openOrder(no) {
  const o = JW.orders().find((x) => x.no === no);
  if (!o) return;
  const dlg = $("#order-dlg");
  const idx = STATUSES.indexOf(o.status);
  const next = idx >= 0 && idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null;
  const certs = (o.certs || []).map((code) => JW.certs().find((c) => c.code === code)).filter(Boolean);
  dlg.innerHTML = `<div class="dlg-head"><div><span class="eyebrow">Pesanan</span><h3>${esc(o.no)}</h3><p>${new Date(o.at).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}, ${fmtTime(o.at)} · via ${esc(o.source || "—")}</p></div><button data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body">
      <div class="sect"><span class="eyebrow">Status</span>
        ${o.status === "Dibatalkan" ? `<div class="note warn">Pesanan ini dibatalkan.</div>` : `<div class="stepper">${STATUSES.map((s, i) => `<button class="${i < idx ? "done" : ""} ${i === idx ? "done cur" : ""}" data-status="${esc(s)}">${esc(s)}</button>`).join("")}</div>`}
        <div class="row" style="margin-top:14px">${next ? `<button class="btn btn-sm btn-ink" data-status="${esc(next)}">Tandai ${esc(next.toLowerCase())} →</button>` : ""}
          ${o.status !== "Dibatalkan" && o.status !== "Selesai" ? `<button class="btn btn-sm btn-danger" data-status="Dibatalkan">Batalkan</button>` : ""}
          ${o.status === "Dibatalkan" ? `<button class="btn btn-sm btn-line" data-status="Menunggu bayar">Aktifkan lagi</button>` : ""}</div></div>
      <div class="sect"><span class="eyebrow">Item</span>
        <ul class="list">${o.items.map((l) => { const p = JW.product(l.id); return `<li><span class="thumb">${art(p)}</span><div><div class="t">${l.qty}× ${esc(l.name)}</div><small>${p ? esc(p.material) : ""}${l.size ? " · ukuran " + esc(l.size) : ""}</small></div><div class="r">${rp(l.price * l.qty)}</div></li>`; }).join("")}</ul>
        <div class="sumgrid"><span class="muted">Subtotal</span><span>${rp(o.subtotal)}</span>${o.discount ? `<span class="muted">Diskon member</span><span>− ${rp(o.discount)}</span>` : ""}<span class="muted">Ongkir · ${esc(o.shipName)}</span><span>${o.shipping ? rp(o.shipping) : "Gratis"}</span><span class="tot">Total</span><span class="tot">${rp(o.total)}</span></div></div>
      <div class="sect"><span class="eyebrow">Pelanggan &amp; pengiriman</span>
        <dl class="kv"><dt>Nama</dt><dd>${esc(o.customer.name)} ${o.memberId ? `<a class="link" href="#member" data-member="${esc(o.memberId)}">member →</a>` : `<span class="muted">(tamu)</span>`}</dd>
        <dt>Telepon</dt><dd>${esc(o.customer.phone)}</dd><dt>Email</dt><dd>${esc(o.customer.email)}</dd><dt>Kota</dt><dd>${esc(o.customer.city)}</dd>
        ${o.customer.address ? `<dt>Alamat</dt><dd>${esc(o.customer.address)}</dd>` : ""}
        <dt>Kurir</dt><dd>${esc(o.shipName)}</dd><dt>Pembayaran</dt><dd>${esc(o.payment)} · ${isPaid(o) ? `<span class="badge ok">lunas</span>` : o.status === "Dibatalkan" ? "—" : `<span class="badge low">menunggu</span>`}</dd></dl>
        <label class="field" style="margin-top:14px"><span>Nomor resi</span><div class="row"><input class="inp" id="resi" value="${esc(o.resi || "")}" placeholder="mis. JNE 0123 4567 8901" style="flex:1;min-width:160px"><button class="btn btn-sm btn-line" data-act="save-resi" data-no="${esc(o.no)}">Simpan</button></div></label></div>
      <div class="sect"><span class="eyebrow">Sertifikat keaslian</span>
        ${certs.length ? `<p class="muted" style="font-size:.82rem;margin-bottom:8px">Sudah diterbitkan atas nama ${esc(o.customer.name)}. Kode dicetak di kartu dan dicek pelanggan di halaman Cek keaslian.</p>
          <div class="codes">${certs.map((c) => `<a href="verify.html?code=${encodeURIComponent(c.code)}" target="_blank" rel="noopener"><span class="code">${esc(c.code)}</span> <small class="muted">${esc(productName(c.product))}</small></a>`).join("")}</div>`
        : `<p class="muted" style="font-size:.82rem;margin-bottom:10px">Satu sertifikat per piece (${o.items.reduce((a, l) => a + l.qty, 0)}), pemilik terdaftar: ${esc(o.customer.name)}.</p>
          <button class="btn btn-sm btn-gold" data-act="issue" data-no="${esc(o.no)}" ${isPaid(o) ? "" : "disabled title=\"Tunggu pembayaran dulu\""}>Terbitkan sertifikat</button>`}</div>
    </div>`;
  dlg.dataset.no = o.no;
  if (!dlg.open) dlg.showModal();
}

pages.produk = () => {
  const ps = JW.products();
  const low = ps.filter((p) => p.stock <= 3).length;
  return `${head("Katalog", "Produk", `${ps.length} produk · ${ps.filter((p) => !p.hidden).length} tampil di toko${low ? ` · <b style="color:var(--warn)">${low} stok menipis</b>` : ""}. Harga dan stok tersimpan otomatis.`, `<button class="btn btn-ink" data-act="add-product">+ Produk baru</button>`)}
    <div class="toolbar"><input class="inp search" type="search" id="p-q" placeholder="Cari produk…" aria-label="Cari produk">
      <div class="chips"><button class="chip on" data-col="">Semua</button>${COLLECTIONS.map((c) => `<button class="chip" data-col="${c.id}">${c.name}</button>`).join("")}</div></div>
    <div class="pgrid" id="p-grid"></div>`;
};
let productCol = "";
function renderProducts() {
  const q = ($("#p-q")?.value || "").toLowerCase().trim();
  const sold = {};
  last30().paid.forEach((o) => o.items.forEach((l) => (sold[l.id] = (sold[l.id] || 0) + l.qty)));
  const ps = JW.products().map((p, i) => ({ p, i })).filter(({ p }) => (!productCol || p.col === productCol) && (!q || p.name.toLowerCase().includes(q)));
  $("#p-grid").innerHTML = ps.map(({ p, i }) => `<article class="pcard ${p.hidden ? "hidden-p" : ""}" data-i="${i}">
    <div class="art">${art(p)}${p.stock <= 3 ? `<span class="badge ${p.stock <= 0 ? "bad" : "low"}">${p.stock <= 0 ? "Habis" : "Stok menipis"}</span>` : p.tag ? `<span class="badge">${esc(p.tag)}</span>` : ""}</div>
    <div class="body"><div><span class="eyebrow">${esc(JW.colName(p.col))}</span><h4>${esc(p.name)}</h4><div class="meta">${esc(p.material)}${p.stone && p.stone !== "—" ? " · " + esc(p.stone) : ""}</div></div>
      <div class="edit"><label>Harga (Rp)<input type="number" min="0" step="50000" data-f="price" value="${p.price}"></label><label>Stok<input type="number" min="0" step="1" data-f="stock" value="${p.stock}"></label></div>
      <div class="foot"><span>${sold[p.id] || 0} terjual · 30 hr</span><label><span class="switch"><input type="checkbox" data-f="show" ${p.hidden ? "" : "checked"} aria-label="Tampilkan ${esc(p.name)} di toko"><span></span></span>Tampil</label></div></div></article>`).join("") || `<p class="muted">Tidak ada produk.</p>`;
}
function openAddProduct() {
  const dlg = $("#product-dlg");
  dlg.innerHTML = `<form method="dialog" id="p-form"><div class="dlg-head"><div><span class="eyebrow">Katalog</span><h3>Produk baru</h3><p>Langsung muncul di toko setelah disimpan.</p></div><button type="button" data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body"><div class="form">
      <label class="field full"><span>Nama</span><input name="name" required placeholder="mis. Aurora Ring"></label>
      <label class="field"><span>Koleksi</span><select name="col">${COLLECTIONS.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label>
      <label class="field"><span>Harga (Rp)</span><input name="price" type="number" min="0" step="50000" required placeholder="4500000"></label>
      <label class="field"><span>Material</span><input name="material" value="Emas 18K"></label>
      <label class="field"><span>Batu</span><input name="stone" placeholder="— atau mis. Safir biru"></label>
      <label class="field"><span>Stok</span><input name="stock" type="number" min="0" value="5"></label>
      <label class="field"><span>Gambar</span><select name="art">${ART_KINDS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
      <label class="field"><span>Latar</span><select name="bg"><option value="stone">Batu</option><option value="ink">Ink</option><option value="ivory">Ivory</option></select></label>
      <div class="field"><span>Pratinjau</span><div class="thumb" id="p-prev" style="width:84px;height:84px">${Art.svg("ring", "stone")}</div></div>
      <label class="field full"><span>Deskripsi</span><textarea name="desc" rows="2" placeholder="Satu-dua kalimat untuk halaman produk"></textarea></label>
    </div></div>
    <div class="dlg-foot"><button type="button" class="btn btn-line" data-close>Batal</button><button class="btn btn-ink" type="submit">Simpan produk</button></div></form>`;
  dlg.showModal();
  const f = $("#p-form");
  f.addEventListener("change", () => { $("#p-prev").innerHTML = Art.svg(f.art.value, f.bg.value); });
  f.addEventListener("submit", () => {
    const d = Object.fromEntries(new FormData(f));
    const ps = JW.products();
    let id = slugify(d.name) || "produk"; while (ps.some((p) => p.id === id)) id += "-2";
    ps.push({ id, slug: id, col: d.col, name: d.name.trim(), price: Math.max(0, +d.price || 0), material: d.material.trim() || "Emas 18K", stone: d.stone.trim() || "—", art: d.art, bg: d.bg, stock: Math.max(0, +d.stock || 0),
      sizes: d.col === "rings" ? ["10", "12", "14", "16"] : undefined, tag: "Baru", desc: d.desc.trim() });
    JW.saveProducts(ps); renderProducts(); toast(`${d.name} ditambahkan ke katalog`);
  });
}

pages.member = () => {
  const ms = JW.members();
  const dist = TIERS.map((t) => ({ t, n: ms.filter((m) => JW.tier(m.spend || 0).id === t.id).length }));
  const total = ms.length || 1;
  const spend = ms.reduce((a, m) => a + (m.spend || 0), 0);
  const memberRev = last30().paid.filter((o) => o.memberId).reduce((a, o) => a + o.total, 0);
  const allRev = last30().paid.reduce((a, o) => a + o.total, 0) || 1;
  return `${head("Loyalitas", "Member", "Tier naik otomatis dari total belanja. Poin: 1 per Rp 10.000, bisa ditukar potongan di checkout.")}
    <div class="grid2">
      <div class="card"><div class="card-head"><div><h3>Sebaran tier</h3><p class="hint">${ms.length} member</p></div></div>
        <div class="split">${dist.map(({ t, n }) => n ? `<div style="flex:${n};background:${TIER_COLOR[t.id]}" data-tip="${esc(`<b>${t.name}</b>${n} member`)}"></div>` : "").join("")}</div>
        <div class="ranks">${dist.map(({ t, n }) => `<div class="rank"><i style="background:${TIER_COLOR[t.id]}"></i><span class="name"><b>${t.name}</b> <span class="muted">· mulai ${t.min ? rpShort(t.min) : "Rp 0"}</span></span><span class="num"><b>${n}</b> · ${Math.round((n / total) * 100)}%</span></div>`).join("")}</div></div>
      <div class="card"><div class="card-head"><div><h3>Nilai member</h3><p class="hint">30 hari terakhir</p></div></div>
        <div class="kv" style="grid-template-columns:1fr auto;font-size:.88rem;gap:10px">
          <dt>Porsi omzet dari member</dt><dd><b>${pct(memberRev / allRev, 0)}</b></dd>
          <dt>Total belanja semua member</dt><dd><b>${rpShort(spend)}</b></dd>
          <dt>Rata-rata per member</dt><dd><b>${rpShort(spend / total)}</b></dd>
          <dt>Poin beredar</dt><dd><b>${num(ms.reduce((a, m) => a + (m.points || 0), 0))}</b></dd></div></div>
    </div>
    <div class="toolbar"><input class="inp search" type="search" id="m-q" placeholder="Cari nama, email, atau kota…" aria-label="Cari member"></div>
    <div class="table-wrap"><table><thead><tr><th>Member</th><th>Tier</th><th class="num">Poin</th><th class="num">Total belanja</th><th class="num">Pesanan</th><th>Bergabung</th></tr></thead><tbody id="m-body"></tbody></table></div>`;
};
function renderMembers() {
  const q = ($("#m-q")?.value || "").toLowerCase().trim();
  const orders = JW.orders();
  const rows = JW.members().filter((m) => !q || [m.name, m.email, m.city].some((v) => String(v || "").toLowerCase().includes(q))).sort((a, b) => (b.spend || 0) - (a.spend || 0));
  $("#m-body").innerHTML = rows.map((m) => `<tr class="click" data-member="${esc(m.id)}" tabindex="0">
    <td class="nowrap"><b>${esc(m.name)}</b><br><small class="muted">${esc(m.email)} · ${esc(m.city || "")}</small></td>
    <td>${tierBadge(JW.tier(m.spend || 0))}</td><td class="num">${num(m.points || 0)}</td><td class="num nowrap">${rp(m.spend || 0)}</td>
    <td class="num">${orders.filter((o) => o.memberId === m.id).length}</td><td class="nowrap">${m.joined ? JW.date(m.joined + "T12:00") : "—"}</td></tr>`).join("") || `<tr><td colspan="6" class="empty-row">Belum ada member.</td></tr>`;
}
function openMember(id) {
  const m = JW.members().find((x) => x.id === id);
  if (!m) return;
  const t = JW.tier(m.spend || 0); const nextT = TIERS.find((x) => x.min > (m.spend || 0));
  const os = JW.orders().filter((o) => o.memberId === id).sort((a, b) => new Date(b.at) - new Date(a.at));
  const dlg = $("#member-dlg");
  dlg.innerHTML = `<div class="dlg-head"><div><span class="eyebrow">Member · ${esc(t.name)}</span><h3>${esc(m.name)}</h3><p>${esc(m.email)} · ${esc(m.phone || "")} · ${esc(m.city || "")}</p></div><button data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body">
      <dl class="kv"><dt>Tier</dt><dd>${tierBadge(t)} ${nextT ? `<span class="muted" style="font-size:.78rem">· ${rpShort(nextT.min - (m.spend || 0))} lagi ke ${nextT.name}</span>` : ""}</dd>
        <dt>Total belanja</dt><dd>${rp(m.spend || 0)}</dd><dt>Poin</dt><dd><b>${num(m.points || 0)}</b> <span class="muted">≈ ${rp((m.points || 0) * 100)} potongan</span></dd>
        <dt>Bergabung</dt><dd>${m.joined ? JW.date(m.joined + "T12:00") : "—"}</dd></dl>
      <div class="sect"><span class="eyebrow">Sesuaikan poin</span>
        <div class="row"><input class="inp" type="number" id="pts" step="10" placeholder="+100 atau −50" style="width:140px"><input class="inp" id="pts-why" placeholder="Alasan (mis. kompensasi keterlambatan)" style="flex:1;min-width:160px"><button class="btn btn-sm btn-ink" data-act="points" data-id="${esc(m.id)}">Terapkan</button></div>
        ${(m.pointLog || []).length ? `<ul class="list" style="margin-top:8px">${m.pointLog.slice(-4).reverse().map((l) => `<li><div><div class="t">${l.delta > 0 ? "+" : ""}${num(l.delta)} poin</div><small>${esc(l.why || "Penyesuaian manual")}</small></div><div class="r muted">${JW.date(l.at)}</div></li>`).join("")}</ul>` : ""}</div>
      <div class="sect"><span class="eyebrow">Riwayat pesanan (${os.length})</span>
        <ul class="list">${os.map((o) => `<li class="click" data-order="${esc(o.no)}"><div><div class="t">${esc(o.no)}</div><small>${fmtDay(o.at)} · ${esc(o.items.map((l) => l.name).join(", "))}</small></div><div class="r">${rp(o.total)}<br>${statusBadge(o.status)}</div></li>`).join("") || `<li class="muted">Belum ada pesanan.</li>`}</ul></div>
    </div>`;
  dlg.dataset.id = id;
  if (!dlg.open) dlg.showModal();
}

// A code counts as suspicious when it's been checked from 4+ different cities.
function certState(c) {
  const cities = [...new Set((c.scans || []).map((s) => s.city))];
  const st = c.status === "revoked" ? "revoked" : c.status === "flagged" || cities.length >= 4 ? "flagged" : "valid";
  return { st, cities };
}
pages.sertifikat = () => {
  const cs = JW.certs();
  const states = cs.map(certState);
  const flagged = states.filter((s) => s.st === "flagged").length;
  const scans = cs.reduce((a, c) => a + (c.scans || []).length, 0);
  return `${head("Cek keaslian", "Sertifikat", "Setiap piece punya kode unik di kartu sertifikat. Pelanggan memindai QR atau mengetik kodenya; setiap pengecekan dicatat lengkap dengan kotanya.",
      `<a class="btn btn-line" href="verify.html" target="_blank" rel="noopener">Buka halaman cek ↗</a><button class="btn btn-ink" data-act="new-cert">+ Terbitkan sertifikat</button>`)}
    <div class="kpis four">
      <div class="card kpi"><span class="eyebrow">Sertifikat aktif</span><div class="val">${states.filter((s) => s.st !== "revoked").length}</div></div>
      <div class="card kpi"><span class="eyebrow">Terdaftar ke pemilik</span><div class="val">${cs.filter((c) => c.owner).length}</div></div>
      <div class="card kpi"><span class="eyebrow">Total pengecekan</span><div class="val">${scans}</div></div>
      <div class="card kpi"><span class="eyebrow">Perlu ditinjau</span><div class="val" style="color:${flagged ? "var(--copper)" : "var(--ink)"}">${flagged}</div></div>
    </div>
    ${flagged ? `<div class="note warn" style="margin-bottom:14px"><b>Kenapa ditandai?</b> Satu kode yang dicek dari banyak kota dalam waktu singkat hampir pasti disalin dari sertifikat asli ke barang tiruan. Hubungi pemilik terdaftar, lalu cabut kodenya bila perlu. Halaman cek akan menampilkan peringatan ke siapa pun yang memindai kode tersebut.</div>` : ""}
    <div class="table-wrap"><table><thead><tr><th>Kode</th><th>Produk</th><th>Serial</th><th>Pemilik</th><th class="num">Dicek</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody>
    ${cs.slice().reverse().map((c) => { const { st, cities } = certState(c); return `<tr class="${st === "flagged" ? "flag" : st === "revoked" ? "revoked" : ""}">
      <td><a class="code link" href="verify.html?code=${encodeURIComponent(c.code)}" target="_blank" rel="noopener" style="color:inherit">${esc(c.code)}</a></td>
      <td class="nowrap">${esc(productName(c.product))}<br><small class="muted">dibuat ${c.made ? JW.date(c.made + "T12:00") : "—"} · ${esc(c.artisan || "")}</small></td>
      <td class="code">${esc(c.serial)}</td>
      <td class="nowrap">${c.owner ? esc(c.owner) : `<span class="muted">belum terdaftar</span>`}</td>
      <td class="num" title="${esc(cities.join(", "))}">${(c.scans || []).length}${cities.length ? `<br><small class="muted">${cities.length} kota</small>` : ""}</td>
      <td style="min-width:150px">${st === "valid" ? `<span class="badge ok">Valid</span>` : st === "revoked" ? `<span class="badge bad">Dicabut</span>` : `<span class="badge low">Ditandai</span><br><small class="muted">Dicek dari ${esc(cities.slice(0, 4).join(", "))}${cities.length > 4 ? ` +${cities.length - 4}` : ""}</small>`}</td>
      <td class="nowrap"><button class="btn btn-sm btn-line" data-cert="${esc(c.code)}">Kartu</button> ${st === "revoked" ? `<button class="btn btn-sm btn-line" data-act="restore-cert" data-code="${esc(c.code)}">Pulihkan</button>` : `<button class="btn btn-sm btn-danger" data-act="revoke" data-code="${esc(c.code)}">Cabut</button>`}</td></tr>`; }).join("") || `<tr><td colspan="7" class="empty-row">Belum ada sertifikat.</td></tr>`}
    </tbody></table></div>`;
};
function certCard(c) {
  const p = JW.product(c.product);
  const url = `${location.origin === "null" ? "" : location.href.replace(/backoffice\.html.*$/, "")}verify.html?code=${c.code}`;
  return `<div class="certcard">
    <div style="position:relative;z-index:1"><span class="logo"><span class="mono">${MONOGRAM}</span><span class="word"><b>JEWELREE</b><small>CERTIFICATE</small></span></span>
      <h4>${esc(p?.name || c.product)}</h4><div style="font-size:.74rem;opacity:.8">${esc(p?.material || "")}${p?.stone && p.stone !== "—" ? " · " + esc(p.stone) : ""}</div>
      <dl><dt>Kode</dt><dd class="code" style="color:var(--gold-hi)">${esc(c.code)}</dd><dt>Serial</dt><dd>${esc(c.serial)}</dd><dt>Dibuat</dt><dd>${c.made ? JW.date(c.made + "T12:00") : "—"} · ${esc(c.artisan || "")}</dd><dt>Pemilik</dt><dd>${esc(c.owner || "—")}</dd></dl></div>
    <div class="qr">${qrSvg(c.code)}</div>
    <div class="url">Pindai atau buka <b>${esc(url)}</b></div></div>`;
}
function openCert(code, fresh) {
  const c = JW.certs().find((x) => x.code === code); if (!c) return;
  const dlg = $("#cert-dlg");
  dlg.innerHTML = `<div class="dlg-head"><div><span class="eyebrow">${fresh ? "Sertifikat baru" : "Kartu sertifikat"}</span><h3 class="code" style="font-family:inherit;font-size:1.3rem">${esc(c.code)}</h3><p>${esc(productName(c.product))} · ${esc(c.serial)}</p></div><button data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body">${fresh ? `<div class="note no-print">Kode tersimpan. Cetak kartunya untuk kotak perhiasan, atau buka halaman cek untuk mencobanya.</div>` : ""}${certCard(c)}</div>
    <div class="dlg-foot"><a class="btn btn-line" href="verify.html?code=${encodeURIComponent(c.code)}" target="_blank" rel="noopener">Coba cek ↗</a><button class="btn btn-ink" data-act="print">Cetak kartu</button></div>`;
  if (!dlg.open) dlg.showModal();
}
function openNewCert() {
  const dlg = $("#cert-dlg");
  dlg.innerHTML = `<form method="dialog" id="c-form"><div class="dlg-head"><div><span class="eyebrow">Cek keaslian</span><h3>Terbitkan sertifikat</h3><p>Kode unik dibuat otomatis.</p></div><button type="button" data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body"><div class="form">
      <label class="field full"><span>Produk</span><select name="product">${JW.products().map((p) => `<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.material)}</option>`).join("")}</select></label>
      <label class="field full"><span>Pemilik <em>opsional, bisa didaftarkan pembeli nanti</em></span><input name="owner" placeholder="Nama pembeli"></label>
    </div></div>
    <div class="dlg-foot"><button type="button" class="btn btn-line" data-close>Batal</button><button class="btn btn-ink" type="submit">Buat kode</button></div></form>`;
  if (!dlg.open) dlg.showModal();
  $("#c-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const cert = JW.issueCert(d.product, d.owner.trim() || null);
    route(); openCert(cert.code, true);
  });
}

// ───────── Journal & SEO ─────────
function seoChecks(p) {
  const kw = (p.keyword || "").toLowerCase().trim();
  const body = Array.isArray(p.body) ? p.body.join("\n\n") : p.body || "";
  const metaLen = (p.meta || "").length;
  const kwSlug = slugify(kw);
  const wc = words(body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " "));
  const internal = /\]\((?!https?:)[^)]+\)|href=["'](?!https?:)[^"']+["']|\]\(https?:\/\/(www\.)?jewelree\.id/i.test(body);
  return [
    { ok: !!kw && (p.title || "").toLowerCase().includes(kw), t: "Kata kunci ada di judul", s: kw ? `“${p.keyword}”` : "Isi kata kunci target dulu" },
    { ok: !!kw && (p.meta || "").toLowerCase().includes(kw), t: "Kata kunci ada di meta description", s: "Google menebalkan kata yang cocok dengan pencarian" },
    { ok: metaLen >= 120 && metaLen <= 160, t: "Meta description 120–160 karakter", s: `Sekarang ${metaLen} karakter` },
    { ok: !!kwSlug && (p.slug || "").includes(kwSlug), t: "Slug memuat kata kunci", s: kwSlug ? `mis. /journal/${kwSlug}` : "—" },
    { ok: wc >= 300, t: "Isi minimal 300 kata", s: `Sekarang ${wc} kata` },
    { ok: internal, t: "Ada tautan internal", s: "mis. [Orbit Pendant](product.html?p=orbit-pendant) atau [Cek keaslian](verify.html)" },
  ];
}
function scoreRing(score) {
  const r = 26, c = 2 * Math.PI * r, color = score >= 80 ? "var(--ok)" : score >= 50 ? "var(--copper)" : "var(--bad)";
  return `<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#EFE9DE" stroke-width="5"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * score) / 100} ${c}" transform="rotate(-90 32 32)"/><text x="32" y="41" text-anchor="middle">${score}</text></svg>`;
}
const postScore = (p) => { const ch = seoChecks(p); return Math.round((ch.filter((x) => x.ok).length / ch.length) * 100); };

pages.journal = () => {
  const posts = JW.posts();
  const days = trafficDays();
  const tot = sourceTotals(); const sessions = Object.values(tot).reduce((a, b) => a + b, 0);
  const prods = JW.products().filter((p) => !p.hidden);
  const pagesTop = [
    { name: "/ (beranda)", v: sessions * 0.34 },
    { name: "/shop", v: sessions * 0.17 },
    ...prods.slice(0, 9).map((p, i) => ({ name: `/product/${p.slug}`, v: sessions * [0.07, 0.055, 0.045, 0.09, 0.035, 0.05, 0.03, 0.06, 0.04][i] })),
    ...posts.filter((p) => p.status === "Terbit").map((p) => ({ name: `/journal/${p.slug}`, v: p.views })),
    { name: "/verify", v: sessions * 0.025 },
  ].sort((a, b) => b.v - a.v).slice(0, 8);
  const q = JW.QUERIES;
  return `${head("Konten & pertumbuhan", "Journal &amp; SEO", "Tulis artikel yang dicari orang di Google, cek skornya sebelum terbit, dan pantau kata kunci yang membawa pengunjung.", `<button class="btn btn-ink" data-act="new-post">+ Artikel baru</button>`)}
    <div class="ga"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--copper)" stroke-width="1.6" stroke-linecap="round"><path d="M4 20V12M10 20V6M16 20v-9M22 20H2"/></svg>
      <span><b>Data contoh.</b> Setelah toko live, angka sesi, halaman, dan kata kunci di bawah ditarik otomatis dari <b>Google Analytics 4</b> dan <b>Google Search Console</b>.</span></div>
    <div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Artikel</h3><p class="hint">Klik untuk menyunting · skor SEO dihitung dari 6 cek</p></div></div>
      <div class="table-wrap" style="border:0"><table><thead><tr><th>Judul</th><th>Kata kunci</th><th>Status</th><th class="num">Skor</th><th class="num">Dilihat</th><th>Tanggal</th></tr></thead><tbody>
      ${posts.map((p, i) => { const s = postScore(p); return `<tr class="click" data-post="${i}" tabindex="0"><td style="min-width:240px"><b style="font-family:var(--font-display);font-size:1.05rem;color:var(--ink)">${esc(p.title || "Tanpa judul")}</b><br><small class="muted">/journal/${esc(p.slug)}</small></td>
        <td class="muted" style="min-width:140px">${esc(p.keyword || "—")}</td><td>${p.status === "Terbit" ? `<span class="badge ok">Terbit</span>` : `<span class="badge">Draf</span>`}</td>
        <td class="num"><b style="color:${s >= 80 ? "var(--ok)" : s >= 50 ? "var(--copper)" : "var(--bad)"}">${s}</b></td><td class="num">${num(p.views || 0)}</td><td class="nowrap">${p.date ? JW.date(p.date + "T12:00") : "—"}</td></tr>`; }).join("")}
      </tbody></table></div></div>
    <div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Analytics · sesi per sumber</h3><p class="hint">${num(sessions)} sesi dalam 30 hari · Google Analytics 4</p></div></div>
      ${stackChart(days, JW.SOURCES, SRC_COLOR, "Sesi per sumber per hari")}</div>
    <div class="grid2">
      <div class="card"><div class="card-head"><div><h3>Kata kunci Google</h3><p class="hint">Search Console · 28 hari</p></div></div>
        <div class="table-wrap" style="border:0"><table><thead><tr><th>Kueri</th><th class="num">Klik</th><th class="num">Tayang</th><th class="num">CTR</th><th class="num">Posisi</th></tr></thead><tbody>
        ${q.map((r) => `<tr><td style="min-width:170px">${esc(r.q)}${r.pos > 10 ? ` <span class="badge low" title="Di halaman 2 Google: peluang artikel baru">peluang</span>` : ""}</td><td class="num">${num(r.clicks)}</td><td class="num">${num(r.impr)}</td><td class="num">${pct(r.clicks / r.impr)}</td><td class="num">${r.pos.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</td></tr>`).join("")}
        </tbody></table></div></div>
      <div class="card"><div class="card-head"><div><h3>Halaman teratas</h3><p class="hint">Tayangan halaman · 30 hari</p></div></div>
        ${ranks(pagesTop, num, (r) => r.name.startsWith("/journal") ? "var(--c2)" : r.name.startsWith("/product") ? "var(--c3)" : "var(--c1)")}
        <div class="legend-row" style="margin:14px 0 0"><span><i style="background:var(--c1)"></i>Halaman toko</span><span><i style="background:var(--c3)"></i>Produk</span><span><i style="background:var(--c2)"></i>Journal</span></div></div>
    </div>`;
};
function openPost(i) {
  const posts = JW.posts();
  const isNew = i == null;
  const p = isNew ? { slug: "", title: "", keyword: "", meta: "", body: [], status: "Draf", views: 0, date: JW.today(), art: "ring", bg: "stone" } : posts[i];
  const body = Array.isArray(p.body) ? p.body.join("\n\n") : p.body || "";
  const dlg = $("#post-dlg");
  dlg.innerHTML = `<form method="dialog" id="post-form"><div class="dlg-head"><div><span class="eyebrow">Journal</span><h3>${isNew ? "Artikel baru" : "Sunting artikel"}</h3><p>Skor dan pratinjau Google diperbarui saat Anda mengetik.</p></div><button type="button" data-close aria-label="Tutup">×</button></div>
    <div class="dlg-body"><div class="editor">
      <div class="form">
        <label class="field full"><span>Judul <em id="c-title"></em></span><input name="title" value="${esc(p.title)}" required></label>
        <label class="field"><span>Slug</span><input name="slug" value="${esc(p.slug)}" placeholder="otomatis dari judul"></label>
        <label class="field"><span>Kata kunci target</span><input name="keyword" value="${esc(p.keyword)}" placeholder="mis. cincin emas 18k"></label>
        <label class="field full"><span>Meta description <em id="c-meta"></em></span><textarea name="meta" rows="3">${esc(p.meta)}</textarea></label>
        <label class="field full"><span>Isi <em id="c-body"></em></span><textarea name="body" rows="12" placeholder="Pisahkan paragraf dengan baris kosong. Tautan: [teks](verify.html)">${esc(body)}</textarea></label>
        <label class="field"><span>Status</span><select name="status"><option ${p.status === "Draf" ? "selected" : ""}>Draf</option><option ${p.status === "Terbit" ? "selected" : ""}>Terbit</option></select></label>
        <label class="field"><span>Tanggal</span><input name="date" type="date" value="${esc(p.date)}"></label>
      </div>
      <div class="stack-v">
        <div class="card"><div class="score" id="score"></div><ul class="checklist" id="checks" style="margin-top:14px"></ul></div>
        <div><span class="eyebrow" style="color:var(--muted);font-size:.6rem;margin-bottom:8px">Pratinjau Google</span><div class="serp" id="serp"></div></div>
      </div>
    </div></div>
    <div class="dlg-foot">${isNew ? "" : `<button type="button" class="btn btn-danger" data-act="del-post" data-i="${i}" style="margin-right:auto">Hapus</button>`}<button type="button" class="btn btn-line" data-close>Batal</button><button class="btn btn-ink" type="submit">Simpan</button></div></form>`;
  dlg.showModal();
  const form = $("#post-form"); const f = new Proxy({}, { get: (_, n) => form.elements[n] });
  let slugTouched = !!p.slug;
  const read = () => ({ ...p, title: f.title.value, slug: f.slug.value || slugify(f.title.value), keyword: f.keyword.value, meta: f.meta.value, body: f.body.value });
  const update = () => {
    const d = read(); const ch = seoChecks(d); const s = Math.round((ch.filter((x) => x.ok).length / ch.length) * 100);
    $("#score").innerHTML = `${scoreRing(s)}<div><b style="font-family:var(--font-display);font-size:1.2rem;color:var(--ink)">${s >= 80 ? "Siap terbit" : s >= 50 ? "Hampir siap" : "Perlu dirapikan"}</b><div class="muted" style="font-size:.78rem">${ch.filter((x) => x.ok).length} dari ${ch.length} cek SEO terpenuhi</div></div>`;
    $("#checks").innerHTML = ch.map((c) => `<li class="${c.ok ? "pass" : ""}"><i>${c.ok ? "✓" : ""}</i><div>${esc(c.t)}<small>${esc(c.s)}</small></div></li>`).join("");
    $("#c-title").textContent = `${d.title.length}/60`; $("#c-meta").textContent = `${d.meta.length} karakter`; $("#c-body").textContent = `${words(d.body)} kata`;
    const title = d.title.length > 60 ? d.title.slice(0, 57) + "…" : d.title || "Judul artikel";
    let meta = d.meta || (d.body.split(/\n/)[0] || "").slice(0, 155); if (meta.length > 160) meta = meta.slice(0, 157) + "…";
    const kw = d.keyword.trim(); const metaHtml = kw ? esc(meta).replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<b>${m}</b>`) : esc(meta);
    $("#serp").innerHTML = `<div class="site"><i>${MONOGRAM}</i><div>Jewelree<small>https://jewelree.id › journal › ${esc(d.slug || "…")}</small></div></div><div class="t">${esc(title)} | Jewelree</div><div class="d">${d.date ? `<span>${esc(fmtDay(d.date + "T12:00"))} — </span>` : ""}${metaHtml || "Tambahkan meta description agar Google tidak memilih kalimat sendiri."}</div>`;
  };
  f.slug.addEventListener("input", () => (slugTouched = true));
  f.title.addEventListener("input", () => { if (!slugTouched) f.slug.value = slugify(f.title.value); });
  form.addEventListener("input", update); update();
  form.addEventListener("submit", () => {
    const d = read();
    const all = JW.posts();
    const rec = { ...p, title: d.title.trim(), slug: slugify(d.slug) || slugify(d.title), keyword: d.keyword.trim(), meta: d.meta.trim(), body: d.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean), status: f.status.value, date: f.date.value || JW.today() };
    if (isNew) all.unshift(rec); else all[i] = rec;
    JW.savePosts(all); route(); toast("Artikel tersimpan");
  });
}

pages.pengaturan = () => {
  const s = settings();
  const payDefs = [["qris", "QRIS", "Semua e-wallet & m-banking"], ["va", "Virtual Account", "BCA, Mandiri, BNI, BRI, Permata"], ["card", "Kartu kredit / debit", "Visa, Mastercard, JCB"], ["cicilan", "Cicilan 0%", "Kartu kredit bank rekanan, 3–12 bulan"]];
  return `${head("Toko", "Pengaturan", "Berlaku untuk toko online dan area member. Tersimpan di browser ini.")}
    <form id="settings-form" class="settings">
      <div class="card"><div class="card-head"><div><h3>Profil toko</h3><p class="hint">Tampil di footer, email konfirmasi, dan tombol WhatsApp.</p></div></div>
        <div class="form">
          <label class="field full"><span>Nama toko</span><input name="storeName" value="${esc(s.storeName)}"></label>
          <label class="field"><span>WhatsApp</span><input name="whatsapp" value="${esc(s.whatsapp)}"></label>
          <label class="field"><span>Email</span><input name="email" type="email" value="${esc(s.email)}"></label>
          <label class="field full"><span>Alamat atelier</span><input name="address" value="${esc(s.address)}"></label>
        </div></div>
      <div class="card"><div class="card-head"><div><h3>Pengiriman</h3><p class="hint">Pilihan yang muncul di checkout.</p></div></div>
        ${JW.SHIPPING.map((o) => `<div class="opt"><div class="grow"><b>${esc(o.name)}</b><small>${esc(o.eta)}</small></div><span class="muted">${o.fee ? rp(o.fee) : "Gratis"}</span><label class="switch"><input type="checkbox" name="ship_${o.id}" ${s.shipping[o.id] ? "checked" : ""} aria-label="${esc(o.name)}"><span></span></label></div>`).join("")}</div>
      <div class="card"><div class="card-head"><div><h3>Pembayaran</h3><p class="hint">Lewat payment gateway, dana masuk otomatis ke rekening toko.</p></div></div>
        ${payDefs.map(([k, n, d]) => `<div class="opt"><div class="grow"><b>${n}</b><small>${d}</small></div><label class="switch"><input type="checkbox" name="pay_${k}" ${s.payments[k] ? "checked" : ""} aria-label="${n}"><span></span></label></div>`).join("")}
        <div class="note" style="margin-top:10px">Gateway: Midtrans / Xendit. Biaya per transaksi ditanggung toko (umumnya QRIS 0,7%, VA ± Rp 4.000, kartu ± 2,9%).</div></div>
      <div class="card"><div class="card-head"><div><h3>Tier membership</h3><p class="hint">Batas total belanja untuk naik tier.</p></div></div>
        <div class="opt"><span class="badge tier-ivory">Ivory</span><div class="grow"><small>Semua member baru</small></div><span class="muted">Rp 0</span></div>
        <div class="opt"><span class="badge tier-copper">Copper</span><div class="grow"><small>${esc(TIERS[1].perks.slice(0, 2).join(" · "))}</small></div><input class="inp" name="tier_copper" type="number" step="1000000" min="0" value="${s.tiers.copper}" style="width:140px;text-align:right"></div>
        <div class="opt"><span class="badge tier-ink">Ink</span><div class="grow"><small>${esc(TIERS[2].perks.slice(0, 2).join(" · "))}</small></div><input class="inp" name="tier_ink" type="number" step="1000000" min="0" value="${s.tiers.ink}" style="width:140px;text-align:right"></div></div>
      <div style="grid-column:1/-1;display:flex;gap:12px;align-items:center"><button class="btn btn-ink" type="submit">Simpan pengaturan</button><span class="saved" id="saved">✓ Tersimpan</span></div>
    </form>
    <div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Data demo</h3><p class="hint">Semua data hanya ada di browser ini. Reset mengembalikan produk, artikel, dan sertifikat awal serta membuat ulang 30 hari data contoh.</p></div></div>
      <button class="btn btn-danger" data-act="reset">Reset demo</button></div>`;
};

// ───────── router ─────────
let current = "dasbor";
function route() {
  const page = location.hash.slice(1) || "dasbor";
  current = pages[page] ? page : "dasbor";
  $$(".side a.nav[href^='#']").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + current));
  const pending = JW.orders().filter((o) => o.status === "Dibayar" || o.status === "Dikemas").length;
  const nc = $("#nav-count"); nc.hidden = !pending; nc.textContent = pending;
  $("#app").innerHTML = pages[current]();
  document.title = `${PAGE_TITLES[current]} · Jewelree Back Office`;
  if (current === "pesanan") renderOrders();
  if (current === "produk") { $$("[data-col]").forEach((b) => b.classList.toggle("on", b.dataset.col === productCol)); renderProducts(); }
  if (current === "member") renderMembers();
}
window.addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
// Another tab (e.g. checkout) wrote to storage: refresh unless the owner is mid-edit.
window.addEventListener("storage", (e) => { if (e.key?.startsWith("jewelree.") && !document.querySelector("dialog[open]") && !document.activeElement?.matches("input, select, textarea")) route(); });

// ───────── events ─────────
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act], [data-order], [data-member], [data-post], [data-cert], [data-chip], [data-col], [data-status], [data-close]");
  if (!t) return;
  if (t.hasAttribute("data-close")) return t.closest("dialog").close();
  if (t.dataset.status) {
    const no = $("#order-dlg").dataset.no; const s = t.dataset.status;
    if (s === "Dibatalkan" && !confirm("Batalkan pesanan ini?")) return;
    JW.updateOrder(no, { status: s, [`at_${slugify(s)}`]: new Date().toISOString() });
    openOrder(no); route(); toast(`${no} → ${s}`); return;
  }
  if (t.dataset.order) { $$("dialog[open]").forEach((d) => d.id !== "order-dlg" && d.close()); return openOrder(t.dataset.order); }
  if (t.dataset.member) { e.preventDefault(); $$("dialog[open]").forEach((d) => d.close()); if (current !== "member") location.hash = "member"; return openMember(t.dataset.member); }
  if (t.dataset.post) return openPost(+t.dataset.post);
  if (t.dataset.cert) return openCert(t.dataset.cert);
  if (t.dataset.chip) { orderFilter = t.dataset.chip; $$("[data-chip]").forEach((b) => b.classList.toggle("on", b === t)); return renderOrders(); }
  if (t.hasAttribute("data-col")) { productCol = t.dataset.col; $$("[data-col]").forEach((b) => b.classList.toggle("on", b === t)); return renderProducts(); }
  switch (t.dataset.act) {
    case "reset":
      if (!confirm("Reset demo? Semua pesanan, member, dan perubahan di browser ini dihapus, lalu data contoh dibuat ulang.")) return;
      JW.resetAll(); JW.ensureSample(); orderFilter = "Semua"; orderQuery = ""; route(); toast("Demo direset"); break;
    case "csv": exportCsv(); break;
    case "save-resi": {
      const no = t.dataset.no; const resi = $("#resi").value.trim();
      const o = JW.orders().find((x) => x.no === no);
      JW.updateOrder(no, resi && o && ["Dibayar", "Dikemas"].includes(o.status) ? { resi, status: "Dikirim" } : { resi });
      openOrder(no); route(); toast(resi ? "Resi tersimpan" + (o && ["Dibayar", "Dikemas"].includes(o.status) ? " · status jadi Dikirim" : "") : "Resi dihapus"); break;
    }
    case "issue": {
      const no = t.dataset.no; const o = JW.orders().find((x) => x.no === no);
      const codes = [];
      o.items.forEach((l) => { if (!JW.product(l.id)) return; for (let k = 0; k < (l.qty || 1); k++) codes.push(JW.issueCert(l.id, o.customer.name).code); });
      JW.updateOrder(no, { certs: codes }); openOrder(no); toast(`${codes.length} sertifikat diterbitkan`); break;
    }
    case "add-product": openAddProduct(); break;
    case "points": {
      const d = Math.round(+$("#pts").value || 0); if (!d) return toast("Isi jumlah poin, mis. 100 atau -50");
      const all = JW.members(); const m = all.find((x) => x.id === t.dataset.id);
      m.points = Math.max(0, (m.points || 0) + d); (m.pointLog ||= []).push({ delta: d, why: $("#pts-why").value.trim(), at: new Date().toISOString() });
      JW.saveMembers(all); openMember(m.id); route(); toast(`${d > 0 ? "+" : ""}${d} poin untuk ${m.name}`); break;
    }
    case "new-cert": openNewCert(); break;
    case "revoke": case "restore-cert": {
      const all = JW.certs(); const c = all.find((x) => x.code === t.dataset.code);
      if (t.dataset.act === "revoke" && !confirm(`Cabut ${c.code}? Halaman cek akan menampilkan kode ini sebagai tidak berlaku.`)) return;
      c.status = t.dataset.act === "revoke" ? "revoked" : "valid"; if (c.status === "valid") c.scans = (c.scans || []).slice(0, 2);
      JW.saveCerts(all); route(); toast(c.status === "revoked" ? "Sertifikat dicabut" : "Sertifikat dipulihkan"); break;
    }
    case "print": window.print(); break;
    case "new-post": openPost(null); break;
    case "del-post": {
      if (!confirm("Hapus artikel ini?")) return;
      const all = JW.posts(); all.splice(+t.dataset.i, 1); JW.savePosts(all); $("#post-dlg").close(); route(); break;
    }
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const t = e.target;
  if (t.dataset?.order) openOrder(t.dataset.order);
  else if (t.dataset?.member && t.tagName === "TR") openMember(t.dataset.member);
  else if (t.dataset?.post) openPost(+t.dataset.post);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "o-q") { orderQuery = e.target.value; renderOrders(); }
  if (e.target.id === "p-q") renderProducts();
  if (e.target.id === "m-q") renderMembers();
});
// Inline product edits
document.addEventListener("change", (e) => {
  const f = e.target.dataset.f; const card = e.target.closest(".pcard");
  if (!f || !card) return;
  const ps = JW.products(); const p = ps[+card.dataset.i];
  if (f === "show") p.hidden = !e.target.checked;
  else p[f] = Math.max(0, Math.round(+e.target.value || 0));
  JW.saveProducts(ps);
  if (f !== "price") renderProducts();
  toast(f === "show" ? `${p.name} ${p.hidden ? "disembunyikan dari" : "tampil di"} toko` : `${p.name}: ${f === "price" ? rp(p.price) : "stok " + p.stock}`);
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "settings-form") return;
  e.preventDefault();
  const fd = new FormData(e.target); const f = e.target;
  const s = { storeName: fd.get("storeName").trim(), whatsapp: fd.get("whatsapp").trim(), email: fd.get("email").trim(), address: fd.get("address").trim(),
    shipping: Object.fromEntries(JW.SHIPPING.map((o) => [o.id, f["ship_" + o.id].checked])),
    payments: Object.fromEntries(["qris", "va", "card", "cicilan"].map((k) => [k, f["pay_" + k].checked])),
    tiers: { copper: Math.max(0, +fd.get("tier_copper") || 0), ink: Math.max(0, +fd.get("tier_ink") || 0) } };
  JStore.set("jewelree.settings", s);
  $("#saved").classList.add("show"); setTimeout(() => $("#saved")?.classList.remove("show"), 1600);
});
// Closing the order drawer refreshes the page underneath (statuses may have changed).
$$("dialog").forEach((d) => d.addEventListener("close", () => { if (d.id === "order-dlg" || d.id === "member-dlg") route(); }));

function exportCsv() {
  const rows = [["no", "tanggal", "pelanggan", "kota", "item", "subtotal", "diskon", "ongkir", "total", "pembayaran", "status", "sumber", "resi"]];
  JW.orders().forEach((o) => rows.push([o.no, o.at, o.customer.name, o.customer.city, o.items.map((l) => `${l.qty}x ${l.name}`).join("; "), o.subtotal, o.discount, o.shipping, o.total, o.payment, o.status, o.source, o.resi || ""]));
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `jewelree-pesanan-${dayKey(new Date())}.csv`; a.click();
}

// Tooltip
const tip = $("#tip");
document.addEventListener("mousemove", (e) => {
  const t = e.target.closest("[data-tip]");
  if (!t) return tip.classList.remove("show");
  tip.innerHTML = t.dataset.tip; tip.classList.add("show");
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
  tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 12) + "px";
});

$("#side-mono").innerHTML = MONOGRAM;
JW.ensureSample();
route();
