// Jewelree demo data shared by the storefront, member area, authenticity checker and back office.
// Everything lives in this browser's localStorage, so the demo is safe to click through.

const JStore = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

// Monogram: a serif J held inside a circle, crossed by one orbital line.
const MONOGRAM = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">
  <circle cx="50" cy="50" r="44" stroke-width="2.2"/>
  <ellipse cx="50" cy="50" rx="47" ry="17" transform="rotate(-28 50 50)" stroke-width="1.1" opacity=".75"/>
  <path d="M41 27h22M56 27v36c0 9-6 14-13 14-6 0-10-4-11-9" stroke-width="5.2" stroke-linecap="round"/>
</svg>`;

const COLLECTIONS = [
  { id: "rings", name: "Cincin", en: "Rings", line: "Sculptural · modern classics" },
  { id: "pendants", name: "Liontin", en: "Pendants", line: "Iconic forms · everyday luxury" },
  { id: "cuffs", name: "Gelang", en: "Cuffs", line: "Bold yet refined" },
  { id: "earrings", name: "Anting", en: "Earrings", line: "Balance & movement" },
];

const DEFAULT_PRODUCTS = [
  { id: "celeste", slug: "celeste-ring", col: "rings", name: "Celeste Ring", price: 4850000, material: "Emas 18K", stone: "—", art: "ring", bg: "stone", stock: 6, sizes: ["10", "12", "14", "16"], tag: "Signature",
    desc: "Cincin pahatan dengan permukaan bertekstur batu, dibentuk tangan di atelier. Berat dan nyaman dipakai setiap hari." },
  { id: "orbit-band", slug: "orbit-band", col: "rings", name: "Orbit Band", price: 3200000, material: "Emas 18K", stone: "—", art: "band", bg: "ivory", stock: 11, sizes: ["10", "12", "14", "16"],
    desc: "Dua garis orbit yang saling melingkar — simbol koneksi, dibuat untuk dipakai berdua." },
  { id: "terra-signet", slug: "terra-signet", col: "rings", name: "Terra Signet", price: 6400000, material: "Emas 18K", stone: "Safir biru", art: "signet", bg: "ink", stock: 3, sizes: ["12", "14", "16", "18"],
    desc: "Signet dengan safir biru tertanam rata, terinspirasi lapisan batuan vulkanik." },
  { id: "orbit-pendant", slug: "orbit-pendant", col: "pendants", name: "Orbit Pendant", price: 7900000, material: "Emas 18K", stone: "Safir biru 2,1 ct", art: "pendant", bg: "ink", stock: 4, tag: "Bestseller",
    desc: "Safir oval dalam bingkai emas yang berputar pada porosnya. Bentuk ikonik Jewelree." },
  { id: "luna-drop", slug: "luna-drop", col: "pendants", name: "Luna Drop", price: 3650000, material: "Emas 18K", stone: "Mutiara air laut", art: "pearlPendant", bg: "stone", stock: 9,
    desc: "Satu mutiara Lombok menggantung bebas di bawah cincin emas kecil." },
  { id: "strata-cuff", slug: "strata-cuff", col: "cuffs", name: "Strata Cuff", price: 9200000, material: "Emas 18K", stone: "—", art: "cuff", bg: "stone", stock: 2, tag: "Edisi terbatas",
    desc: "Gelang terbuka dengan relief guratan batu. Statement piece yang tetap tenang." },
  { id: "ribbon-cuff", slug: "ribbon-cuff", col: "cuffs", name: "Ribbon Cuff", price: 5600000, material: "Perak 925 lapis emas", stone: "—", art: "cuffThin", bg: "ivory", stock: 8,
    desc: "Garis tipis yang mengikuti pergelangan, ringan seperti pita satin." },
  { id: "equilibre", slug: "equilibre-earrings", col: "earrings", name: "Équilibre Earrings", price: 4300000, material: "Emas 18K", stone: "Mutiara air laut", art: "earrings", bg: "stone", stock: 7, tag: "Baru",
    desc: "Lingkar ganda dan mutiara yang bergerak mengikuti langkah. Modern heirloom." },
  { id: "halo-hoops", slug: "halo-hoops", col: "earrings", name: "Halo Hoops", price: 2450000, material: "Perak 925 lapis emas", stone: "—", art: "hoops", bg: "ink", stock: 14,
    desc: "Anting lingkar ramping untuk setiap hari — pintu masuk ke koleksi Jewelree." },
];

// ───────── Product art ─────────
// Hand-drawn SVG stand-ins for product photography: gold pieces on stone, ink or ivory grounds.
const Art = {
  _n: 0,
  svg(kind, bg = "stone") {
    const id = "a" + (++Art._n);
    const grounds = {
      stone: ["#d9d1c1", "#b9b0a0", "#8f8676"],
      ink: ["#24476f", "#1a3253", "#0f1f36"],
      ivory: ["#fbf6ea", "#efe6d3", "#ddd1b9"],
      night: ["#3a3a3a", "#262626", "#141414"],
    }[bg] || ["#d9d1c1", "#b9b0a0", "#8f8676"];
    const defs = `<defs>
      <radialGradient id="${id}g" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="${grounds[0]}"/><stop offset=".55" stop-color="${grounds[1]}"/><stop offset="1" stop-color="${grounds[2]}"/></radialGradient>
      <linearGradient id="${id}au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2ac"/><stop offset=".35" stop-color="#d4a85c"/><stop offset=".6" stop-color="#9c6e2c"/><stop offset=".85" stop-color="#e9c983"/><stop offset="1" stop-color="#8a5f22"/></linearGradient>
      <radialGradient id="${id}sap" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#6d9be0"/><stop offset=".45" stop-color="#1f4e9a"/><stop offset="1" stop-color="#0a1c44"/></radialGradient>
      <radialGradient id="${id}pearl" cx="36%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ece6da"/><stop offset="1" stop-color="#b7ae9e"/></radialGradient>
      <radialGradient id="${id}sh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    </defs>`;
    const au = `url(#${id}au)`, sap = `url(#${id}sap)`, pearl = `url(#${id}pearl)`, sh = `url(#${id}sh)`;
    const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sh}"/>`;
    const chain = `<path d="M140 0 C150 70 175 110 196 128 M260 0 C250 70 225 110 204 128" stroke="${au}" stroke-width="2" fill="none" stroke-dasharray="3 2"/>`;
    const pieces = {
      ring: `${shadow(200, 318, 120, 22)}
        <ellipse cx="200" cy="232" rx="92" ry="74" fill="none" stroke="${au}" stroke-width="30"/>
        <ellipse cx="200" cy="232" rx="92" ry="74" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-dasharray="6 9"/>
        <path d="M150 168 q50 -26 100 0" fill="none" stroke="#5b3f14" stroke-opacity=".35" stroke-width="3"/>`,
      band: `${shadow(200, 316, 130, 22)}
        <ellipse cx="180" cy="230" rx="82" ry="66" fill="none" stroke="${au}" stroke-width="14"/>
        <ellipse cx="226" cy="236" rx="82" ry="66" fill="none" stroke="${au}" stroke-width="14" transform="rotate(-8 226 236)"/>`,
      signet: `${shadow(200, 318, 120, 22)}
        <ellipse cx="200" cy="246" rx="86" ry="66" fill="none" stroke="${au}" stroke-width="22"/>
        <ellipse cx="200" cy="176" rx="50" ry="32" fill="${au}"/>
        <ellipse cx="200" cy="172" rx="26" ry="17" fill="${sap}" stroke="#7a5420" stroke-width="2"/>`,
      pendant: `${chain}${shadow(200, 340, 70, 14)}
        <circle cx="200" cy="138" r="11" fill="none" stroke="${au}" stroke-width="5"/>
        <ellipse cx="200" cy="232" rx="62" ry="84" fill="none" stroke="${au}" stroke-width="12"/>
        <ellipse cx="200" cy="232" rx="42" ry="62" fill="${sap}"/>
        <path d="M200 172 l24 32 -24 92 -24 -92z M176 204h48" fill="none" stroke="#a9c6f2" stroke-opacity=".35" stroke-width="1.5"/>
        <ellipse cx="200" cy="232" rx="96" ry="30" fill="none" stroke="${au}" stroke-width="3" transform="rotate(-24 200 232)"/>`,
      pearlPendant: `${chain}${shadow(200, 326, 50, 10)}
        <circle cx="200" cy="148" r="22" fill="none" stroke="${au}" stroke-width="7"/>
        <path d="M200 170v16" stroke="${au}" stroke-width="4"/>
        <circle cx="200" cy="230" r="44" fill="${pearl}"/>`,
      cuff: `${shadow(200, 318, 140, 24)}
        <path d="M86 220 C86 140 314 140 314 220 C314 300 86 300 86 220" fill="none" stroke="${au}" stroke-width="40" stroke-dasharray="560 140" stroke-dashoffset="-40" stroke-linecap="round"/>
        <path d="M110 205 C130 165 270 165 290 205" fill="none" stroke="#5b3f14" stroke-opacity=".3" stroke-width="2" stroke-dasharray="14 6"/>`,
      cuffThin: `${shadow(200, 312, 140, 20)}
        <path d="M80 222 C80 146 320 146 320 222 C320 298 80 298 80 222" fill="none" stroke="${au}" stroke-width="12" stroke-dasharray="600 120" stroke-dashoffset="-30" stroke-linecap="round"/>
        <path d="M96 230 C96 162 304 162 304 230" fill="none" stroke="${au}" stroke-width="5" stroke-linecap="round"/>`,
      earrings: [140, 260].map((x) => `${shadow(x, 336, 34, 8)}
        <circle cx="${x}" cy="128" r="9" fill="${au}"/>
        <ellipse cx="${x}" cy="196" rx="30" ry="50" fill="none" stroke="${au}" stroke-width="9"/>
        <ellipse cx="${x}" cy="196" rx="14" ry="50" fill="none" stroke="${au}" stroke-width="5"/>
        <circle cx="${x}" cy="272" r="26" fill="${pearl}"/>`).join(""),
      hoops: [150, 250].map((x) => `${shadow(x, 330, 50, 9)}
        <circle cx="${x}" cy="220" r="62" fill="none" stroke="${au}" stroke-width="9"/>`).join(""),
    };
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice">${defs}
      <rect width="400" height="400" fill="url(#${id}g)"/>
      <rect width="400" height="400" fill="#000" filter="url(#${id}n)"/>
      <path d="M0 330 C90 300 160 340 260 316 S360 300 400 312 V400 H0z" fill="#000" opacity=".08"/>
      ${pieces[kind] || pieces.ring}</svg>`;
  },
};

// ───────── Membership ─────────
const TIERS = [
  { id: "ivory", name: "Ivory", min: 0, perks: ["Poin 1 per Rp 10.000", "Akses awal koleksi baru", "Pembersihan gratis 1×/tahun"] },
  { id: "copper", name: "Copper", min: 10000000, perks: ["Poin 1,25×", "Ukir nama gratis", "Hadiah ulang tahun", "Pembersihan gratis 2×/tahun"] },
  { id: "ink", name: "Ink", min: 30000000, perks: ["Poin 1,5×", "Private viewing di atelier", "Resize & polish seumur hidup", "Personal stylist"] },
];

// ───────── Journal (blog) ─────────
const DEFAULT_POSTS = [
  { slug: "cara-membaca-sertifikat-perhiasan", title: "Cara membaca sertifikat perhiasan sebelum membeli", keyword: "sertifikat perhiasan", date: "2026-10-02", status: "Terbit", views: 4120, art: "pendant", bg: "ink",
    meta: "Kadar emas, berat, batu, dan kode unik: empat hal di sertifikat perhiasan yang wajib dicek sebelum membayar.",
    body: ["Sertifikat bukan selembar kertas formalitas. Ia adalah satu-satunya bukti bahwa yang Anda bawa pulang sama dengan yang dijanjikan.", "Mulailah dari kadar. Emas 18K berarti 75% emas murni; cap 750 di bagian dalam cincin harus cocok dengan yang tertulis di sertifikat.", "Lalu cek berat dan batu. Untuk safir, sertifikat yang baik menyebut karat, warna, dan apakah batu dipanaskan.", "Terakhir, kode unik. Di Jewelree, setiap piece punya kode yang bisa Anda cek sendiri di halaman Cek Keaslian — dan kami tahu kalau kode yang sama dicek dari banyak kota sekaligus."] },
  { slug: "merawat-emas-18k-di-iklim-tropis", title: "Merawat emas 18K di iklim tropis", keyword: "merawat emas 18K", date: "2026-09-18", status: "Terbit", views: 2870, art: "ring", bg: "stone",
    meta: "Keringat, kelembapan, dan parfum: panduan singkat merawat emas 18K supaya tetap berkilau di iklim tropis Indonesia.",
    body: ["Kelembapan tinggi dan keringat mempercepat kusam, terutama pada emas dengan campuran tembaga.", "Lepaskan perhiasan sebelum berenang, olahraga, atau memakai parfum. Simpan terpisah dalam kantong beludru agar tidak saling gores.", "Bersihkan dengan air hangat dan sabun lembut, lalu keringkan dengan kain mikrofiber. Member Jewelree mendapat pembersihan profesional gratis setiap tahun."] },
  { slug: "safir-biru-vs-tanzanite", title: "Safir biru atau tanzanite? Memilih batu biru yang tepat", keyword: "safir biru", date: "2026-09-04", status: "Terbit", views: 1940, art: "signet", bg: "ink",
    meta: "Perbedaan safir biru dan tanzanite dari kekerasan, harga, hingga cara memakainya setiap hari.", body: ["Keduanya biru, tetapi tidak sama. Safir berada di angka 9 skala Mohs — cukup keras untuk cincin harian.", "Tanzanite lebih lembut dan lebih cocok untuk anting atau liontin yang jarang terbentur."] },
  { slug: "hadiah-perhiasan-pertama", title: "Hadiah perhiasan pertama: panduan untuk yang belum tahu ukuran", keyword: "hadiah perhiasan untuk pacar", date: "2026-10-20", status: "Draf", views: 0, art: "earrings", bg: "stone",
    meta: "", body: ["Tidak tahu ukuran cincin? Mulailah dari anting atau liontin."] },
];

// ───────── Authenticity certificates ─────────
// Each piece carries a code on its certificate card. Scans are logged so copies show up.
const DEFAULT_CERTS = [
  { code: "JW-7K2Q-9M4A", product: "celeste", serial: "CEL-0418", made: "2026-03-14", artisan: "Wayan S.", weight: "6,2 g", owner: "Rania A.", registered: "2026-04-02", scans: [{ at: "2026-04-02", city: "Jakarta" }, { at: "2026-08-19", city: "Jakarta" }], status: "valid" },
  { code: "JW-3HTP-6XBN", product: "orbit-pendant", serial: "ORB-0112", made: "2026-05-30", artisan: "Made K.", weight: "4,8 g · safir 2,1 ct", owner: null, registered: null, scans: [], status: "valid" },
  { code: "JW-9ZQE-1LTR", product: "strata-cuff", serial: "STR-0007", made: "2026-01-21", artisan: "Wayan S.", weight: "21,5 g", owner: "Dimas P.", registered: "2026-02-10",
    scans: [{ at: "2026-09-01", city: "Medan" }, { at: "2026-09-03", city: "Surabaya" }, { at: "2026-09-03", city: "Makassar" }, { at: "2026-09-05", city: "Bandung" }, { at: "2026-09-06", city: "Batam" }, { at: "2026-09-06", city: "Pontianak" }], status: "flagged" },
];

// ───────── Store API ─────────
const JW = {
  products: () => JStore.get("jewelree.products", DEFAULT_PRODUCTS),
  saveProducts: (p) => JStore.set("jewelree.products", p),
  product: (id) => JW.products().find((p) => p.id === id || p.slug === id),

  cart: () => JStore.get("jewelree.cart", []),
  saveCart: (c) => { JStore.set("jewelree.cart", c); document.dispatchEvent(new CustomEvent("cart")); },
  addToCart(id, size) {
    const c = JW.cart(); const line = c.find((l) => l.id === id && l.size === size);
    if (line) line.qty++; else c.push({ id, size: size || null, qty: 1 });
    JW.saveCart(c);
  },

  orders: () => JStore.get("jewelree.orders", []),
  saveOrders: (o) => JStore.set("jewelree.orders", o),
  addOrder(o) { const all = JW.orders(); all.push(o); JW.saveOrders(all); },
  updateOrder(no, patch) { const all = JW.orders(); const o = all.find((x) => x.no === no); if (o) { Object.assign(o, patch); JW.saveOrders(all); } return o; },

  members: () => JStore.get("jewelree.members", []),
  saveMembers: (m) => JStore.set("jewelree.members", m),
  me() { const id = JStore.get("jewelree.session", null); return id ? JW.members().find((m) => m.id === id) || null : null; },
  saveMe(patch) { const all = JW.members(); const m = all.find((x) => x.id === patch.id); if (m) Object.assign(m, patch); JW.saveMembers(all); },
  tier(spend) { return [...TIERS].reverse().find((t) => spend >= t.min); },

  wishlist: () => JStore.get("jewelree.wishlist", []),
  toggleWish(id) { const w = JW.wishlist(); const i = w.indexOf(id); i >= 0 ? w.splice(i, 1) : w.push(id); JStore.set("jewelree.wishlist", w); return i < 0; },

  posts: () => JStore.get("jewelree.posts", DEFAULT_POSTS),
  savePosts: (p) => JStore.set("jewelree.posts", p),

  certs: () => JStore.get("jewelree.certs", DEFAULT_CERTS),
  saveCerts: (c) => JStore.set("jewelree.certs", c),
  newCode() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r = () => abc[Math.floor(Math.random() * abc.length)];
    let code; const taken = new Set(JW.certs().map((c) => c.code));
    do { code = `JW-${r()}${r()}${r()}${r()}-${r()}${r()}${r()}${r()}`; } while (taken.has(code));
    return code;
  },
  issueCert(productId, owner) {
    const p = JW.product(productId); const certs = JW.certs();
    const n = certs.filter((c) => c.product === productId).length + 1;
    const cert = { code: JW.newCode(), product: productId, serial: `${p.name.slice(0, 3).toUpperCase()}-${String(400 + n).padStart(4, "0")}`, made: JW.today(), artisan: ["Wayan S.", "Made K.", "Ketut A."][n % 3], weight: "—", owner: owner || null, registered: owner ? JW.today() : null, scans: [], status: "valid" };
    certs.push(cert); JW.saveCerts(certs); return cert;
  },

  normCode: (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^JW?/, "").replace(/^(.{4})(.{0,4}).*$/, (m, a, b) => `JW-${a}${b ? "-" + b : ""}`),

  rp: (n) => "Rp " + Math.round(n).toLocaleString("id-ID"),
  rpShort: (n) => (n >= 1e9 ? "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " M" : n >= 1e6 ? "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt" : JW.rp(n)),
  today: () => new Date().toISOString().slice(0, 10),
  colName: (id) => (COLLECTIONS.find((c) => c.id === id) || { name: id }).name,
  date: (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),

  SOURCES: ["Google organik", "Instagram", "Langsung", "Meta Ads", "Journal", "WhatsApp"],
  SHIPPING: [{ id: "reg", name: "Reguler berasuransi", eta: "2–4 hari", fee: 45000 }, { id: "same", name: "Same day (Jabodetabek)", eta: "Hari ini", fee: 85000 }, { id: "pickup", name: "Ambil di atelier", eta: "Siap besok", fee: 0 }],
  PAYMENTS: ["QRIS", "Virtual Account", "Kartu kredit / debit", "Cicilan 0% (kartu)"],

  // Thirty days of believable orders and traffic so the back office has something to show.
  sample() {
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const products = DEFAULT_PRODUCTS;
    const names = ["Rania A.", "Dimas P.", "Sekar W.", "Adrian T.", "Nadia K.", "Bimo S.", "Laras M.", "Kevin H.", "Putri D.", "Yoga R.", "Citra L.", "Farah N.", "Galih P.", "Intan S.", "Hana F."];
    const cities = ["Jakarta Selatan", "Bandung", "Surabaya", "Denpasar", "Tangerang", "Medan", "Yogyakarta", "Bekasi"];
    const srcW = [["Google organik", 32], ["Instagram", 26], ["Langsung", 14], ["Meta Ads", 14], ["Journal", 8], ["WhatsApp", 6]];
    const srcPool = srcW.flatMap(([s, w]) => Array(w).fill(s));
    const members = names.slice(0, 11).map((name, i) => ({ id: "m" + (i + 1), name, phone: "08" + String(1100000000 + i * 7919337).slice(0, 10), email: name.split(" ")[0].toLowerCase() + "@contoh.id", city: cities[i % cities.length], joined: "", points: 0, spend: 0 }));
    const orders = []; const traffic = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    for (let d = 29; d >= 0; d--) {
      const day = new Date(now); day.setDate(day.getDate() - d);
      const iso = day.toISOString().slice(0, 10);
      const weekend = [0, 6].includes(day.getDay());
      const sessions = {}; JW.SOURCES.forEach((s) => (sessions[s] = 0));
      const total = Math.round((weekend ? 520 : 380) * (0.85 + rnd() * 0.3) * (1 + (29 - d) / 90));
      for (let i = 0; i < total; i++) sessions[pick(srcPool)]++;
      traffic.push({ date: iso, sessions, total });
      const n = Math.round(total * (0.011 + rnd() * 0.006));
      for (let i = 0; i < n; i++) {
        const items = [{ ...pick(products) }]; if (rnd() < 0.18) items.push({ ...pick(products) });
        const lines = items.map((p) => ({ id: p.id, name: p.name, price: p.price, qty: 1, size: p.sizes ? pick(p.sizes) : null }));
        const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
        const ship = pick(JW.SHIPPING);
        const member = rnd() < 0.55 ? pick(members) : null;
        const at = new Date(day); at.setHours(9 + Math.floor(rnd() * 13), Math.floor(rnd() * 60));
        const age = d;
        const status = age > 6 ? "Selesai" : age > 3 ? pick(["Dikirim", "Selesai"]) : age > 1 ? pick(["Dikemas", "Dikirim"]) : pick(["Menunggu bayar", "Dibayar", "Dikemas"]);
        const discount = member && rnd() < 0.3 ? Math.round(subtotal * 0.05 / 1000) * 1000 : 0;
        const o = { no: "JWL-" + (10200 + orders.length), at: at.toISOString(), customer: member ? { name: member.name, phone: member.phone, email: member.email, city: member.city } : { name: pick(names.slice(11)), phone: "0812xxxx" + Math.floor(rnd() * 9000 + 1000), email: "tamu@contoh.id", city: pick(cities) },
          items: lines, subtotal, discount, shipping: ship.fee, shipName: ship.name, total: subtotal - discount + ship.fee, payment: pick(JW.PAYMENTS), status, source: pick(srcPool), memberId: member ? member.id : null };
        if (member && status !== "Menunggu bayar") { member.spend += o.total; member.points += Math.floor(o.total / 10000); if (!member.joined || iso < member.joined) member.joined = iso; }
        orders.push(o);
      }
    }
    members.forEach((m) => { if (!m.joined) m.joined = new Date(now - 40 * 864e5).toISOString().slice(0, 10); });
    return { orders, traffic, members };
  },
  ensureSample() {
    if (JStore.get("jewelree.seeded", false)) return;
    const s = JW.sample();
    JW.saveOrders([...s.orders, ...JW.orders()]);
    JW.saveMembers([...s.members, ...JW.members()]);
    JStore.set("jewelree.traffic", s.traffic);
    JStore.set("jewelree.seeded", true);
  },
  traffic: () => JStore.get("jewelree.traffic", []),
  resetAll() { Object.keys(localStorage).filter((k) => k.startsWith("jewelree.")).forEach((k) => JStore.del(k)); },

  // Top Google searches that led to the site, Search Console style.
  QUERIES: [
    { q: "cincin emas 18k custom", clicks: 412, impr: 9800, pos: 4.2 },
    { q: "safir biru asli", clicks: 296, impr: 7400, pos: 5.8 },
    { q: "jewelree", clicks: 281, impr: 640, pos: 1.0 },
    { q: "sertifikat perhiasan emas", clicks: 214, impr: 5100, pos: 3.1 },
    { q: "anting mutiara lombok", clicks: 168, impr: 6200, pos: 8.4 },
    { q: "cara merawat perhiasan emas", clicks: 151, impr: 4300, pos: 6.0 },
    { q: "cincin tunangan jakarta", clicks: 88, impr: 12100, pos: 14.7 },
  ],
};
