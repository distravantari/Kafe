// Storefront chrome: header, mobile nav, cart drawer, footer, toast, and the PWA install hook.
// Pages mark their slots with <div data-site-head></div> and <div data-site-foot></div>.

const ICON = {
  bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
};

const Site = {
  logo: (sub = "Atelier") => `<span class="mono">${MONOGRAM}</span><span class="word"><b>JEWELREE</b><small>${sub.toUpperCase()}</small></span>`,

  head() {
    const here = location.pathname.split("/").pop() || "index.html";
    const links = [["index.html#koleksi", "Koleksi"], ["journal.html", "Journal"], ["member.html", "Membership"], ["verify.html", "Cek Keaslian"]];
    const nav = links.map(([h, t]) => `<a href="${h}" class="${h.startsWith(here) && here !== "index.html" ? "on" : ""}">${t}</a>`).join("");
    const me = JW.me();
    return `<div class="announce">Pengiriman berasuransi gratis di atas Rp 5 jt · <a href="verify.html">Setiap piece bersertifikat, cek kodenya di sini</a></div>
      <header class="site-head"><div class="wrap">
        <nav aria-label="Utama">${nav}</nav>
        <button class="icon-btn menu-btn" aria-label="Menu" data-menu>${ICON.menu}</button>
        <a href="index.html" class="logo" aria-label="Jewelree, beranda">${Site.logo()}</a>
        <div class="tools">
          <button class="install-btn" data-install>Pasang app</button>
          <a href="verify.html" class="icon-btn" aria-label="Cek keaslian" title="Cek keaslian">${ICON.shield}</a>
          <a href="member.html" class="icon-btn" aria-label="${me ? "Akun " + JW.esc(me.name) : "Masuk member"}" title="${me ? JW.esc(me.name) : "Member"}">${ICON.user}</a>
          <button class="icon-btn" aria-label="Keranjang" data-open-cart>${ICON.bag}<span class="count" data-cart-count></span></button>
        </div>
      </div>
      <nav class="mobile-nav" aria-label="Menu mobile">${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}<a href="#" data-install>Pasang sebagai app</a></nav>
      </header>
      <div class="scrim" data-scrim></div>
      <aside class="drawer" aria-label="Keranjang" data-drawer>
        <header><h2>Keranjang</h2><button class="icon-btn" aria-label="Tutup" data-close-cart>${ICON.close}</button></header>
        <div class="lines" data-lines></div>
        <footer data-cart-foot></footer>
      </aside>
      <div class="toast" role="status" data-toast></div>`;
  },

  foot() {
    return `<footer class="site-foot"><div class="wrap">
      <div class="cols">
        <div><a href="index.html" class="logo">${Site.logo()}</a><p>Objects with origin. Perhiasan emas 18K yang dibuat tangan di atelier kami, dibuat untuk disimpan lama.</p></div>
        <div><h4>Belanja</h4><ul>${COLLECTIONS.map((c) => `<li><a href="index.html?c=${c.id}#koleksi">${c.name}</a></li>`).join("")}</ul></div>
        <div><h4>Layanan</h4><ul><li><a href="verify.html">Cek keaslian</a></li><li><a href="member.html">Membership</a></li><li><a href="journal.html">Panduan perawatan</a></li><li><a href="#">Ukuran cincin</a></li></ul></div>
        <div><h4>Atelier</h4><ul><li>Jl. Senopati 18, Jakarta</li><li>Sel–Min · 11.00–20.00</li><li><a href="#">WhatsApp concierge</a></li><li><a href="brand.html">Brand guideline</a></li></ul></div>
      </div>
      <div class="base"><span>© 2026 Jewelree Atelier · Demo untuk proposal</span><span>Pembayaran: QRIS · Virtual Account · Kartu · Cicilan 0%</span></div>
    </div></footer>`;
  },

  toast(msg) {
    const t = document.querySelector("[data-toast]"); if (!t) return;
    t.textContent = msg; t.classList.add("show"); clearTimeout(Site._t); Site._t = setTimeout(() => t.classList.remove("show"), 2200);
  },

  cartTotal() { return JW.cart().reduce((s, l) => s + (JW.product(l.id)?.price || 0) * l.qty, 0); },

  renderCart() {
    const cart = JW.cart().filter((l) => JW.product(l.id));
    const count = cart.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = count || ""));
    const lines = document.querySelector("[data-lines]"); const foot = document.querySelector("[data-cart-foot]");
    if (!lines) return;
    if (!cart.length) {
      lines.innerHTML = `<div class="empty"><div class="mono">${MONOGRAM}</div><p>Keranjang masih kosong.</p></div>`;
      foot.innerHTML = `<a href="index.html#koleksi" class="btn btn-line" data-close-cart>Lihat koleksi</a>`;
      return;
    }
    lines.innerHTML = cart.map((l, i) => { const p = JW.product(l.id); return `<div class="line">
      <a class="thumb" href="product.html?p=${p.slug}">${Art.svg(p.art, p.bg)}</a>
      <div><b>${JW.esc(p.name)}</b><small>${p.material}${l.size ? " · ukuran " + l.size : ""}</small><br>
        <span class="qty"><button aria-label="Kurangi" data-q="${i}" data-d="-1">−</button><span>${l.qty}</span><button aria-label="Tambah" data-q="${i}" data-d="1">+</button></span></div>
      <span class="price">${JW.rp(p.price * l.qty)}</span></div>`; }).join("");
    const total = Site.cartTotal();
    foot.innerHTML = `<div class="sum"><span>Subtotal</span><b>${JW.rp(total)}</b></div>
      <p class="note">${total >= 5000000 ? "Pengiriman berasuransi gratis." : "Tambah " + JW.rp(5000000 - total) + " untuk pengiriman gratis."} Sertifikat keaslian disertakan di setiap piece.</p>
      <a href="checkout.html" class="btn btn-ink">Checkout</a>`;
    lines.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => {
      const c = JW.cart().filter((l) => JW.product(l.id)); const l = c[+b.dataset.q];
      l.qty += +b.dataset.d; if (l.qty <= 0) c.splice(+b.dataset.q, 1); JW.saveCart(c);
    }));
  },

  openCart(open = true) {
    document.querySelector("[data-drawer]")?.classList.toggle("open", open);
    document.querySelector("[data-scrim]")?.classList.toggle("open", open);
  },

  card(p) {
    const wished = JW.wishlist().includes(p.id);
    return `<a class="card" href="product.html?p=${p.slug}">
      <div class="pic">${Art.svg(p.art, p.bg)}${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
        <button class="wish ${wished ? "on" : ""}" aria-label="Simpan ke wishlist" data-wish="${p.id}">${ICON.heart}</button></div>
      <div><small class="eyebrow" style="color:var(--muted);font-size:.6rem">${JW.colName(p.col)}</small><h3>${JW.esc(p.name)}</h3></div>
      <div class="meta"><span class="price">${JW.rp(p.price)}</span><small>${p.material}</small></div></a>`;
  },

  bindWish(root = document) {
    root.querySelectorAll("[data-wish]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const on = JW.toggleWish(b.dataset.wish); b.classList.toggle("on", on);
      Site.toast(on ? "Disimpan ke wishlist" : "Dihapus dari wishlist");
    }));
  },

  // PWA: register the service worker and surface the browser's install prompt as our own button.
  pwa() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
    let deferred = null;
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; document.querySelectorAll(".install-btn").forEach((b) => b.classList.add("show")); });
    // Delegated, so install buttons rendered later by a page also work.
    document.addEventListener("click", async (e) => {
      if (!e.target.closest("[data-install]")) return;
      e.preventDefault();
      if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; return; }
      const ios = /iphone|ipad/i.test(navigator.userAgent);
      Site.toast(ios ? "Safari: Bagikan → Tambah ke Layar Utama" : "Menu browser → Instal aplikasi");
    });
  },

  init() {
    const h = document.querySelector("[data-site-head]"); if (h) h.outerHTML = Site.head();
    const f = document.querySelector("[data-site-foot]"); if (f) f.outerHTML = Site.foot();
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-cart]")) Site.openCart(true);
      if (e.target.closest("[data-close-cart]") || e.target.closest("[data-scrim]")) Site.openCart(false);
      if (e.target.closest("[data-menu]")) document.querySelector(".mobile-nav")?.classList.toggle("open");
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && Site.openCart(false));
    document.addEventListener("cart", () => Site.renderCart());
    Site.renderCart();
    Site.pwa();
  },
};

Site.init();
