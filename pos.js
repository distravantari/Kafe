// Kafe POS — front counter. Pure client-side: cart lives in localStorage.

let MENU = Kafe.menu();
let SETTINGS = Kafe.settings();
const taxLabel = () => `${SETTINGS.taxLabel} ${SETTINGS.taxRate}%`;
const nextOrderNo = () => Kafe.orders().reduce((a, o) => Math.max(a, o.no), 0) + 1;

// ───────── state ─────────
const store = KafeStore;
let cart = store.get("kafe.cart", []);       // [{key, id, name, unit, qty, opts:{}, note}]
let orderType = store.get("kafe.type", "Dine in");
let orderNo = nextOrderNo();
let activeCat = "all";
let query = "";

const $ = (s, r = document) => r.querySelector(s);
const rp = Kafe.rp;
const save = () => { store.set("kafe.cart", cart); store.set("kafe.type", orderType); };

// ───────── menu ─────────
function renderCats() {
  const all = [{ id: "all", name: "All" }, ...CATEGORIES];
  $("#cats").innerHTML = all.map((c) =>
    `<button class="cat ${c.id === activeCat ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
}

function renderMenu() {
  const q = query.trim().toLowerCase();
  const items = MENU.filter((m) =>
    (activeCat === "all" || m.cat === activeCat) &&
    (!q || (m.name + " " + m.desc).toLowerCase().includes(q)));
  $("#grid").innerHTML = items.length ? items.map((m) => {
    const inCart = cart.filter((c) => c.id === m.id).reduce((a, c) => a + c.qty, 0);
    if (!m.available) return `<div class="item cat-${m.cat} soldout" aria-disabled="true">
      <span class="tag">Sold out</span><span class="glyph" aria-hidden="true"></span>
      <span class="name">${m.name}</span><span class="desc">${m.desc}</span><span class="price">${rp(m.price)}</span></div>`;
    return `<button class="item cat-${m.cat}" data-id="${m.id}">
      ${inCart ? `<span class="badge">${inCart}</span>` : ""}
      ${m.tag ? `<span class="tag">${m.tag}</span>` : ""}
      <span class="glyph" aria-hidden="true"></span>
      <span class="name">${m.name}</span>
      <span class="desc">${m.desc}</span>
      <span class="price">${rp(m.price)}</span>
    </button>`;
  }).join("") : `<p class="empty-grid">Nothing matches “${query}”.</p>`;
}

// ───────── options modal ─────────
let pending = null;

function openItem(id) {
  const m = MENU.find((x) => x.id === id);
  if (!m.opts.length) return addToCart(m, {}, "");
  pending = { m, sel: Object.fromEntries(m.opts.map((o) => [o, 0])) };
  $("#opt-title").textContent = m.name;
  $("#opt-desc").textContent = m.desc;
  $("#opt-note").value = "";
  $("#opt-groups").innerHTML = m.opts.map((o) => `
    <fieldset><legend>${OPT[o].name}</legend><div class="chips">
      ${OPT[o].choices.map(([label, add], i) => `
        <label class="chip"><input type="radio" name="${o}" value="${i}" ${i === 0 ? "checked" : ""}>
        <span>${label}${add ? ` <small>+${add / 1000}k</small>` : ""}</span></label>`).join("")}
    </div></fieldset>`).join("");
  updateOptTotal();
  $("#opt-modal").showModal();
}

function optUnit() {
  return pending.m.price + Object.entries(pending.sel).reduce((a, [o, i]) => a + OPT[o].choices[i][1], 0);
}
function updateOptTotal() { $("#opt-add").textContent = `Add · ${rp(optUnit())}`; }

// ───────── cart ─────────
function addToCart(m, sel, note) {
  const opts = Object.fromEntries(Object.entries(sel).map(([o, i]) => [o, OPT[o].choices[i][0]]));
  const unit = m.price + Object.entries(sel).reduce((a, [o, i]) => a + OPT[o].choices[i][1], 0);
  const key = m.id + "|" + JSON.stringify(opts) + "|" + note;
  const existing = cart.find((c) => c.key === key);
  if (existing) existing.qty++;
  else cart.push({ key, id: m.id, name: m.name, unit, qty: 1, opts, note });
  save(); render(); bump();
}

function totals() {
  const subtotal = cart.reduce((a, c) => a + c.unit * c.qty, 0);
  const tax = Math.round(subtotal * SETTINGS.taxRate / 100);
  return { subtotal, tax, total: subtotal + tax, count: cart.reduce((a, c) => a + c.qty, 0) };
}

function optSummary(c) {
  const parts = Object.values(c.opts).filter((v) => !["Normal", "Regular", "Whole", "No", "As is"].includes(v));
  if (c.note) parts.push(`“${c.note}”`);
  return parts.join(" · ");
}

function renderCart() {
  const t = totals();
  $("#order-no").textContent = "#" + String(orderNo).padStart(3, "0");
  document.querySelectorAll("[data-type]").forEach((b) => b.classList.toggle("on", b.dataset.type === orderType));
  $("#lines").innerHTML = cart.length ? cart.map((c, i) => `
    <li class="line">
      <div class="line-main"><b>${c.name}</b><small>${optSummary(c)}</small></div>
      <div class="qty">
        <button data-dec="${i}" aria-label="Remove one">−</button><span>${c.qty}</span><button data-inc="${i}" aria-label="Add one">+</button>
      </div>
      <span class="line-price">${rp(c.unit * c.qty)}</span>
    </li>`).join("") : `<li class="empty"><div data-mascot></div><p>No orders yet.<br>Tap something tasty.</p></li>`;
  if (!cart.length && window.injectMascots) window.injectMascots();
  $("#subtotal").textContent = rp(t.subtotal);
  $("#tax").textContent = rp(t.tax);
  $("#total").textContent = rp(t.total);
  $("#tax-label").textContent = taxLabel();
  $("#charge").disabled = !cart.length;
  $("#charge").textContent = cart.length ? `Charge ${rp(t.total)}` : "Charge";
  $("#fab-count").textContent = t.count;
  $("#fab-total").textContent = rp(t.total);
  $("#fab").hidden = !cart.length;
}

function render() { renderCats(); renderMenu(); renderCart(); }
function bump() { const f = $("#fab"); f.classList.remove("bump"); void f.offsetWidth; f.classList.add("bump"); }

// ───────── checkout ─────────
let payMethod = "Cash";

function openCheckout() {
  const t = totals();
  payMethod = "Cash";
  $("#pay-total").textContent = rp(t.total);
  $("#cash-in").value = "";
  const quick = [...new Set([t.total, Math.ceil(t.total / 50000) * 50000, Math.ceil(t.total / 100000) * 100000, Math.ceil(t.total / 100000) * 100000 + 100000])];
  $("#quick-cash").innerHTML = quick.map((v) => `<button type="button" data-cash="${v}">${v === t.total ? "Exact" : rp(v)}</button>`).join("");
  showPayStep(); updateChange();
  $("#pay-modal").showModal();
}

function showPayStep() {
  document.querySelectorAll("[data-pay]").forEach((b) => b.classList.toggle("on", b.dataset.pay === payMethod));
  $("#cash-box").hidden = payMethod !== "Cash";
  $("#qris-box").hidden = payMethod !== "QRIS";
  $("#card-box").hidden = payMethod !== "Card";
  $("#pay-step").hidden = false;
  $("#receipt").hidden = true;
  updateChange();
}

function updateChange() {
  const t = totals();
  const paid = Number($("#cash-in").value || 0);
  const ok = payMethod !== "Cash" || paid >= t.total;
  $("#change").textContent = payMethod === "Cash" && paid ? rp(Math.max(0, paid - t.total)) : "—";
  $("#confirm-pay").disabled = !ok;
}

function confirmPay() {
  const t = totals();
  const paid = payMethod === "Cash" ? Number($("#cash-in").value) : t.total;
  const no = "#" + String(orderNo).padStart(3, "0");
  const now = new Date();
  $("#receipt").innerHTML = `
    <div class="rc-head"><span class="logo">Kafe<span class="bean"></span></span>
      <p>${SETTINGS.address}</p>
      <p>${now.toLocaleDateString("id-ID")} · ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div>
    <div class="rc-order"><span>Order</span><b>${no}</b><span>${orderType}</span></div>
    <ul>${cart.map((c) => `<li><span>${c.qty}× ${c.name}${optSummary(c) ? `<small>${optSummary(c)}</small>` : ""}</span><span>${rp(c.unit * c.qty)}</span></li>`).join("")}</ul>
    <div class="rc-sum"><span>Subtotal</span><span>${rp(t.subtotal)}</span><span>${taxLabel()}</span><span>${rp(t.tax)}</span>
      <b>Total</b><b>${rp(t.total)}</b><span>${payMethod}</span><span>${rp(paid)}</span>
      ${payMethod === "Cash" ? `<span>Change</span><span>${rp(paid - t.total)}</span>` : ""}</div>
    <p class="rc-thanks">${SETTINGS.footer}</p>
    <div class="rc-actions"><button class="btn btn-ghost-dark" type="button" onclick="window.print()">Print</button>
      <button class="btn btn-brick" type="button" id="new-order">New order →</button></div>`;
  Kafe.addOrder({ no: orderNo, at: now.toISOString(), type: orderType, method: payMethod,
    lines: cart.map((c) => ({ id: c.id, name: c.name, cat: (MENU.find((m) => m.id === c.id) || {}).cat, unit: c.unit, qty: c.qty, opts: c.opts, note: c.note })),
    subtotal: t.subtotal, tax: t.tax, total: t.total, paid });
  $("#pay-step").hidden = true;
  $("#receipt").hidden = false;
  $("#new-order").onclick = newOrder;
}

function newOrder() {
  cart = []; orderNo = nextOrderNo(); save();
  $("#pay-modal").close(); document.body.classList.remove("cart-open"); render();
}

// ───────── events ─────────
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, [data-close]");
  if (!t) return;
  if (t.dataset.cat) { activeCat = t.dataset.cat; renderCats(); renderMenu(); }
  else if (t.dataset.id) openItem(t.dataset.id);
  else if (t.dataset.inc) { cart[+t.dataset.inc].qty++; save(); render(); }
  else if (t.dataset.dec) { const c = cart[+t.dataset.dec]; c.qty--; if (!c.qty) cart.splice(+t.dataset.dec, 1); save(); render(); }
  else if (t.dataset.type) { orderType = t.dataset.type; save(); renderCart(); }
  else if (t.dataset.pay) { payMethod = t.dataset.pay; showPayStep(); }
  else if (t.dataset.cash) { $("#cash-in").value = t.dataset.cash; updateChange(); }
  else if (t.id === "clear" && cart.length && confirm("Clear this order?")) { cart = []; save(); render(); }
  else if (t.id === "charge") openCheckout();
  else if (t.id === "confirm-pay") confirmPay();
  else if (t.id === "fab") document.body.classList.add("cart-open");
  else if (t.id === "close-cart") document.body.classList.remove("cart-open");
  else if (t.hasAttribute("data-close")) t.closest("dialog").close();
});

$("#opt-groups").addEventListener("change", (e) => { pending.sel[e.target.name] = +e.target.value; updateOptTotal(); });
$("#opt-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addToCart(pending.m, pending.sel, $("#opt-note").value.trim());
  $("#opt-modal").close();
});
$("#search").addEventListener("input", (e) => { query = e.target.value; renderMenu(); });
$("#cash-in").addEventListener("input", updateChange);
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("#search").focus(); }
});
setInterval(() => { $("#clock").textContent = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }, 1000);

// Pick up menu/settings changes made in the back office (other tab) without a reload.
window.addEventListener("storage", (e) => {
  if (e.key === "kafe.menu" || e.key === "kafe.settings") { MENU = Kafe.menu(); SETTINGS = Kafe.settings(); render(); }
  if (e.key === "kafe.orders") { orderNo = nextOrderNo(); renderCart(); }
});

render();
