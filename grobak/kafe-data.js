// Grobak demo data for the POS and back office. Everything lives in this browser's localStorage.

const KafeStore = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const CATEGORIES = [
  { id: "sate", name: "Sate" },
  { id: "paket", name: "Paket" },
  { id: "side", name: "Pendamping" },
  { id: "drink", name: "Minuman" },
];

// Option groups. Each choice may add to the price.
const OPT = {
  bumbu: { name: "Bumbu", choices: [["Kacang", 0], ["Kecap", 0], ["Campur", 0]] },
  pedas: { name: "Pedas", choices: [["Sedang", 0], ["Pedas", 0], ["Tidak pedas", 0]] },
  porsi: { name: "Porsi", choices: [["Normal", 0], ["+5 tusuk", 12000]] },
  karbo: { name: "Pakai", choices: [["Lontong", 0], ["Nasi", 0], ["Tanpa", -3000]] },
  temp: { name: "Sajian", choices: [["Es", 0], ["Hangat", 0]] },
  sugar: { name: "Manis", choices: [["Normal", 0], ["Sedikit", 0], ["Tawar", 0]] },
};

const DEFAULT_MENU = [
  { id: "sa", cat: "sate", name: "Sate Ayam", desc: "10 tusuk, bumbu kacang", price: 25000, opts: ["bumbu", "pedas", "porsi", "karbo"], tag: "Andalan" },
  { id: "sk", cat: "sate", name: "Sate Kambing", desc: "10 tusuk, kecap & bawang", price: 40000, opts: ["pedas", "porsi", "karbo"] },
  { id: "st", cat: "sate", name: "Sate Taichan", desc: "Sambal & jeruk nipis", price: 25000, opts: ["pedas", "porsi", "karbo"] },
  { id: "sp", cat: "sate", name: "Sate Padang", desc: "Kuah kuning kental", price: 30000, opts: ["pedas", "karbo"] },
  { id: "skl", cat: "sate", name: "Sate Kulit", desc: "Garing, 10 tusuk", price: 18000, opts: ["bumbu", "pedas"] },
  { id: "sat", cat: "sate", name: "Sate Ati Ampela", desc: "5 tusuk, empuk", price: 15000, opts: ["bumbu"] },
  { id: "pk1", cat: "paket", name: "Paket Hemat", desc: "5 sate ayam + lontong + es teh", price: 25000, opts: ["bumbu", "pedas"] },
  { id: "pk2", cat: "paket", name: "Paket Kenyang", desc: "10 sate ayam + nasi + es jeruk", price: 35000, opts: ["bumbu", "pedas"], tag: "Laris" },
  { id: "pk3", cat: "paket", name: "Paket Rame-rame", desc: "30 sate ayam + 3 lontong", price: 75000, opts: ["bumbu", "pedas"] },
  { id: "lon", cat: "side", name: "Lontong", desc: "Per porsi", price: 5000, opts: [] },
  { id: "nas", cat: "side", name: "Nasi Putih", desc: "Per porsi", price: 5000, opts: [] },
  { id: "ker", cat: "side", name: "Kerupuk", desc: "Satu bungkus", price: 2000, opts: [] },
  { id: "tel", cat: "side", name: "Telur Asin", desc: "Satu butir", price: 6000, opts: [] },
  { id: "teh", cat: "drink", name: "Es Teh Manis", desc: "Teh tubruk, gula batu", price: 5000, opts: ["temp", "sugar"] },
  { id: "jer", cat: "drink", name: "Es Jeruk", desc: "Jeruk peras segar", price: 8000, opts: ["temp", "sugar"] },
  { id: "tb", cat: "drink", name: "Teh Botol", desc: "Dingin dari cooler", price: 6000, opts: [] },
  { id: "air", cat: "drink", name: "Air Mineral", desc: "600 ml", price: 4000, opts: [] },
];

const DEFAULT_SETTINGS = {
  storeName: "Grobak",
  address: "Mangkal: Jl. Pemuda, depan minimarket · 16.00–23.00",
  taxLabel: "Pajak",
  taxRate: 0,
  footer: "Matur nuwun! Sate hangat, hati senang.",
};

const Kafe = {
  menu: () => KafeStore.get("grobak.menu", DEFAULT_MENU).map((m) => ({ available: true, ...m })),
  saveMenu: (m) => KafeStore.set("grobak.menu", m),
  settings: () => ({ ...DEFAULT_SETTINGS, ...KafeStore.get("grobak.settings", {}) }),
  saveSettings: (s) => KafeStore.set("grobak.settings", s),
  orders: () => KafeStore.get("grobak.orders", []),
  saveOrders: (o) => KafeStore.set("grobak.orders", o),
  addOrder(order) { const o = Kafe.orders(); o.push(order); Kafe.saveOrders(o); },
  updateOrder(no, patch) {
    const all = Kafe.orders(); const o = all.find((x) => x.no === no);
    if (o) { Object.assign(o, typeof patch === "function" ? patch(o) : patch); Kafe.saveOrders(all); }
    return o;
  },
  // Which prep station makes a category. Ready-made sides need no prep.
  station: (cat) => (cat === "drink" ? "Drinks" : cat === "side" ? null : "Grill"),
  rp: (n) => "Rp " + Math.round(n).toLocaleString("id-ID"),
  catName: (id) => (CATEGORIES.find((c) => c.id === id) || { name: id }).name,

  // A week of believable sample orders so the back office has something to show.
  sampleOrders() {
    const menu = DEFAULT_MENU;
    const weights = { sa: 14, sk: 5, st: 7, sp: 3, skl: 4, sat: 3, pk1: 8, pk2: 9, pk3: 2, lon: 6, nas: 5, ker: 6, tel: 2, teh: 12, jer: 6, tb: 3, air: 3 };
    const pool = menu.flatMap((m) => Array(Math.ceil((weights[m.id] || 1) * 10)).fill(m));
    const hourCurve = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 6, 10, 12, 10, 7, 4, 0];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const s = Kafe.settings();
    const orders = [];
    let no = 1;
    const today = new Date();
    for (let d = 6; d >= 0; d--) {
      const day = new Date(today); day.setDate(today.getDate() - d); day.setHours(0, 0, 0, 0);
      const weekend = [0, 6].includes(day.getDay());
      for (let h = 16; h <= 22; h++) {
        if (d === 0 && h > today.getHours()) break;
        const n = Math.round(hourCurve[h] * (weekend ? 1.35 : 1) * (0.7 + rnd() * 0.6));
        for (let i = 0; i < n; i++) {
          const at = new Date(day); at.setHours(h, Math.floor(rnd() * 60));
          if (at > today) continue;
          const lines = [];
          const count = 1 + Math.floor(rnd() * rnd() * 4);
          for (let j = 0; j < count; j++) {
            const m = pick(pool);
            const opts = {};
            let unit = m.price;
            m.opts.forEach((o) => { const c = rnd() < 0.7 ? OPT[o].choices[0] : pick(OPT[o].choices); opts[o] = c[0]; unit += c[1]; });
            lines.push({ id: m.id, name: m.name, cat: m.cat, unit, qty: rnd() < 0.85 ? 1 : 2, opts, note: "" });
          }
          const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
          const tax = Math.round(subtotal * s.taxRate / 100);
          const r = rnd();
          const method = r < 0.45 ? "QRIS" : "Cash";
          const total = subtotal + tax;
          orders.push({ no: no++, at: at.toISOString(), type: rnd() < 0.4 ? "Dine in" : "Takeaway", method,
            lines, subtotal, tax, total, status: "done", paid: method === "Cash" ? Math.ceil(total / 10000) * 10000 : total, sample: true });
        }
      }
    }
    return orders;
  },
};
