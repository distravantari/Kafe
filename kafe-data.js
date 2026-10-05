// Shared data for the POS and back office. Everything lives in this browser's localStorage.

const KafeStore = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const CATEGORIES = [
  { id: "espresso", name: "Espresso Bar" },
  { id: "manual", name: "Manual Brew" },
  { id: "notcoffee", name: "Not Coffee" },
  { id: "oven", name: "From the Oven" },
  { id: "beans", name: "Beans & Goods" },
];

// Option groups. Each choice may add to the price.
const OPT = {
  temp: { name: "Temperature", choices: [["Hot", 0], ["Iced", 3000]] },
  size: { name: "Size", choices: [["Regular", 0], ["Large", 8000]] },
  milk: { name: "Milk", choices: [["Whole", 0], ["Oat", 8000], ["Almond", 8000]] },
  sugar: { name: "Sweetness", choices: [["Normal", 0], ["Less", 0], ["None", 0]] },
  shot: { name: "Extra shot", choices: [["No", 0], ["+1 shot", 7000]] },
  warm: { name: "Serve", choices: [["Warmed", 0], ["As is", 0]] },
};

const DEFAULT_MENU = [
  { id: "esp", cat: "espresso", name: "Espresso", desc: "Double shot, house blend", price: 25000, opts: ["shot"] },
  { id: "ame", cat: "espresso", name: "Americano", desc: "Bright & clean", price: 30000, opts: ["temp", "size", "shot"] },
  { id: "fw", cat: "espresso", name: "Flat White", desc: "Silky, strong, small", price: 35000, opts: ["milk", "shot"] },
  { id: "lat", cat: "espresso", name: "Kafe Latte", desc: "Palm sugar & sea salt", price: 38000, opts: ["temp", "size", "milk", "sugar"], tag: "Signature" },
  { id: "cap", cat: "espresso", name: "Cappuccino", desc: "Thick foam, cocoa dust", price: 35000, opts: ["size", "milk"] },
  { id: "moc", cat: "espresso", name: "Mocha", desc: "70% dark chocolate", price: 40000, opts: ["temp", "size", "milk", "sugar"] },
  { id: "v60", cat: "manual", name: "V60", desc: "Single origin of the week", price: 40000, opts: [] },
  { id: "jpi", cat: "manual", name: "Japanese Iced", desc: "Flash-brewed over ice", price: 42000, opts: [] },
  { id: "cb", cat: "manual", name: "Cold Brew", desc: "18-hour steep", price: 36000, opts: ["size"] },
  { id: "hoj", cat: "notcoffee", name: "Hojicha Latte", desc: "Roasted green tea", price: 36000, opts: ["temp", "milk", "sugar"] },
  { id: "mat", cat: "notcoffee", name: "Matcha Latte", desc: "Ceremonial grade", price: 38000, opts: ["temp", "milk", "sugar"] },
  { id: "cho", cat: "notcoffee", name: "Chocolate", desc: "Steamed milk, dark choc", price: 34000, opts: ["temp", "milk", "sugar"] },
  { id: "lem", cat: "notcoffee", name: "Lemon Tea", desc: "Fresh-squeezed", price: 28000, opts: ["temp", "sugar"] },
  { id: "cro", cat: "oven", name: "Butter Croissant", desc: "Flaky, every morning", price: 28000, opts: ["warm"] },
  { id: "pac", cat: "oven", name: "Pain au Chocolat", desc: "Two bars of dark choc", price: 32000, opts: ["warm"] },
  { id: "ban", cat: "oven", name: "Banana Bread", desc: "Toasted, with butter", price: 26000, opts: ["warm"] },
  { id: "cook", cat: "oven", name: "Sea Salt Cookie", desc: "Brown butter, chunky", price: 22000, opts: [] },
  { id: "hb", cat: "beans", name: "House Blend 250g", desc: "Choc, caramel, red apple", price: 120000, opts: [] },
  { id: "cup", cat: "beans", name: "Kopi Tumbler", desc: "Keeps warm for 6h", price: 185000, opts: [] },
  { id: "tote", cat: "beans", name: "Kopi Tote", desc: "Heavy canvas", price: 150000, opts: [] },
];

const DEFAULT_SETTINGS = {
  storeName: "Kafe",
  address: "Jl. Senja Hangat No. 7, Kota Kopi",
  taxLabel: "PB1",
  taxRate: 10,
  footer: "Thank you! Sit, sip, stay a while.",
};

const Kafe = {
  menu: () => KafeStore.get("kafe.menu", DEFAULT_MENU).map((m) => ({ available: true, ...m })),
  saveMenu: (m) => KafeStore.set("kafe.menu", m),
  settings: () => ({ ...DEFAULT_SETTINGS, ...KafeStore.get("kafe.settings", {}) }),
  saveSettings: (s) => KafeStore.set("kafe.settings", s),
  orders: () => KafeStore.get("kafe.orders", []),
  saveOrders: (o) => KafeStore.set("kafe.orders", o),
  addOrder(order) { const o = Kafe.orders(); o.push(order); Kafe.saveOrders(o); },
  updateOrder(no, patch) {
    const all = Kafe.orders(); const o = all.find((x) => x.no === no);
    if (o) { Object.assign(o, typeof patch === "function" ? patch(o) : patch); Kafe.saveOrders(all); }
    return o;
  },
  // Which prep station makes a category. Retail goods need no prep.
  station: (cat) => (cat === "oven" ? "Kitchen" : cat === "beans" ? null : "Bar"),
  rp: (n) => "Rp " + Math.round(n).toLocaleString("id-ID"),
  catName: (id) => (CATEGORIES.find((c) => c.id === id) || { name: id }).name,

  // A week of believable sample orders so the back office has something to show.
  sampleOrders() {
    const menu = DEFAULT_MENU;
    const weights = { esp: 4, ame: 8, fw: 6, lat: 12, cap: 6, moc: 3, v60: 4, jpi: 3, cb: 5, hoj: 3, mat: 4, cho: 2, lem: 3, cro: 7, pac: 3, ban: 4, cook: 5, hb: 1, cup: 0.4, tote: 0.3 };
    const pool = menu.flatMap((m) => Array(Math.ceil((weights[m.id] || 1) * 10)).fill(m));
    const hourCurve = [0, 0, 0, 0, 0, 0, 0, 6, 10, 9, 6, 5, 7, 6, 5, 6, 8, 7, 5, 4, 3, 0, 0, 0];
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
      for (let h = 7; h <= 20; h++) {
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
          const method = r < 0.55 ? "QRIS" : r < 0.8 ? "Cash" : "Card";
          const total = subtotal + tax;
          orders.push({ no: no++, at: at.toISOString(), type: rnd() < 0.6 ? "Dine in" : "Takeaway", method,
            lines, subtotal, tax, total, status: "done", paid: method === "Cash" ? Math.ceil(total / 50000) * 50000 : total, sample: true });
        }
      }
    }
    return orders;
  },
};
