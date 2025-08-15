
const qs = (s, el=document)=> el.querySelector(s);
const qsa = (s, el=document)=> [...el.querySelectorAll(s)];
const fmtIDR = v => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(v);

// Year
qs('#year').textContent = new Date().getFullYear();

// Animate on view
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
},{threshold:.15});
qsa('[data-anim]').forEach(el=> io.observe(el));

// Sliders
qsa('.slider').forEach(slider=>{
  const slides = qsa('.slide', slider);
  const prev = qs('.prev', slider);
  const next = qs('.next', slider);
  const dots = qs('.dots', slider);
  let i=0, auto;
  const set = (n)=>{
    slides[i].classList.remove('current');
    dots.children[i]?.classList.remove('active');
    i=(n+slides.length)%slides.length;
    slides[i].classList.add('current');
    dots.children[i]?.classList.add('active');
  };
  slides.forEach((_,idx)=>{
    const b=document.createElement('button');
    if(idx===0) b.classList.add('active');
    b.addEventListener('click', ()=> { set(idx); restart(); });
    dots.appendChild(b);
  });
  prev.addEventListener('click', ()=> { set(i-1); restart(); });
  next.addEventListener('click', ()=> { set(i+1); restart(); });
  const restart=()=>{ clearInterval(auto); auto=setInterval(()=> set(i+1), 4500); };
  restart();
});

// Catalog data
const products = [
  {id:'cat-fox', name:'Keychain Hewan Rubah', cat:'Keychain hewan', price:35000, img:'assets/images/cat-hewan.svg', stock:10, rating:4.7},
  {id:'cat-bear', name:'Keychain Hewan Beruang', cat:'Keychain hewan', price:32000, img:'assets/images/cat-hewan.svg', stock:0, rating:4.5},
  {id:'fruit-apple', name:'Keychain Buah Apel', cat:'Keychain berbentuk buah', price:30000, img:'assets/images/cat-buah.svg', stock:8, rating:4.4},
  {id:'logo-kpop', name:'Keychain Logo K‑Pop', cat:'Keychain logo kpop', price:45000, img:'assets/images/cat-logo-kpop.svg', stock:5, rating:4.8},
  {id:'custom-text', name:'Keychain Custom Nama', cat:'Keychain custom', price:55000, img:'assets/images/cat-custom.svg', stock:20, rating:4.6},
  {id:'kpop-lightstick', name:'Keychain K‑Pop Lightstick', cat:'Keychain kpop', price:42000, img:'assets/images/cat-kpop.svg', stock:12, rating:4.3},
  {id:'skz-chan', name:'Keychain Stray Kids', cat:'Keychain stray kids', price:48000, img:'assets/images/cat-stray-kids.svg', stock:6, rating:4.9},
  {id:'album-mini', name:'Keychain Album Mini', cat:'Keychain album', price:39000, img:'assets/images/cat-album.svg', stock:3, rating:4.2},
  {id:'lyric-card', name:'Keychain Lirik Lagu', cat:'Keychain lirik lagu', price:36000, img:'assets/images/cat-lirik.svg', stock:9, rating:4.4},
];

// Search + filters
let activeCat='all';
const search = qs('#search');
const grid = qs('#product-grid');
const chips = qsa('.chip');
chips.forEach(ch=> ch.addEventListener('click', ()=>{
  chips.forEach(c=> c.classList.remove('active'));
  ch.classList.add('active');
  activeCat = ch.dataset.cat;
  renderProducts();
}));
search.addEventListener('input', renderProducts);

function stars(v){
  const full = Math.floor(v);
  const half = v-full >= .5 ? 1:0;
  return '★'.repeat(full) + (half?'½':'') + '☆'.repeat(5-full-half);
}
function renderProducts(){
  const q = (search.value||'').toLowerCase().trim();
  grid.innerHTML='';
  products
    .filter(p => activeCat==='all' || p.cat===activeCat)
    .filter(p => p.name.toLowerCase().includes(q))
    .forEach(p=>{
      const out = p.stock<=0;
      const card = document.createElement('article');
      card.className='card';
      card.innerHTML = `
        <div class="thumb"><img src="${p.img}" alt="${p.name}"></div>
        <div class="body">
          <div class="badges">
            <span class="badge">${p.cat}</span>
            ${out?'<span class="badge out">Habis</span>':'<span class="badge stock">Tersedia</span>'}
          </div>
          <h4>${p.name}</h4>
          <div class="rating">${stars(p.rating)} <span>(${p.rating.toFixed(1)})</span></div>
          <div class="price">${fmtIDR(p.price)}</div>
        </div>
        <div class="foot">
          <div class="qty">
            <button class="minus" aria-label="Kurangi">–</button>
            <input type="number" min="1" value="1" aria-label="Qty">
            <button class="plus" aria-label="Tambah">+</button>
          </div>
          <button class="btn primary add" ${out?'disabled':''}>+ Keranjang</button>
        </div>
      `;
      const input = qs('input', card);
      qs('.plus', card).addEventListener('click', ()=> input.value = Math.max(1, (+input.value||1)+1));
      qs('.minus', card).addEventListener('click', ()=> input.value = Math.max(1, (+input.value||1)-1));
      qs('.add', card).addEventListener('click', ()=> addToCart(p, +input.value||1));
      grid.appendChild(card);
    });
}
renderProducts();

// Cart
const CART_KEY='cu_cart_v2';
const readCart = ()=> JSON.parse(localStorage.getItem(CART_KEY)||'[]');
const writeCart = items=> localStorage.setItem(CART_KEY, JSON.stringify(items));
const cartBtn = qs('#cart-btn'); const cartDrawer = qs('#cart');
const cartItems = qs('#cart-items'); const closeCart = qs('#close-cart');
const countEl = qs('#cart-count');
const subEl = qs('#cart-sub'); const discEl = qs('#cart-disc'); const totalEl = qs('#cart-total');
const shipEl = qs('#cart-ship'); const ship = 10000;

function discount(items){
  const qty = items.reduce((a,b)=> a+b.qty,0);
  const sub = items.reduce((a,b)=> a+b.price*b.qty,0);
  return qty>3 ? Math.round(sub*0.1) : 0;
}
function renderCart(){
  const items = readCart();
  countEl.textContent = items.reduce((a,b)=> a+b.qty,0);
  cartItems.innerHTML='';
  items.forEach(it=>{
    const row = document.createElement('div');
    row.className='cart-item';
    row.innerHTML = `
      <img src="${it.img}" alt="${it.name}">
      <div>
        <h5>${it.name}</h5>
        <div class="qty">
          <button class="m">–</button>
          <input type="number" min="1" value="${it.qty}">
          <button class="p">+</button>
        </div>
        <div class="price">${fmtIDR(it.price)}</div>
      </div>
      <button class="btn ghost del">Hapus</button>
    `;
    qs('.m', row).addEventListener('click', ()=> updateQty(it.id, it.qty-1));
    qs('.p', row).addEventListener('click', ()=> updateQty(it.id, it.qty+1));
    qs('input', row).addEventListener('change', e=> updateQty(it.id, +e.target.value||1));
    qs('.del', row).addEventListener('click', ()=> removeFromCart(it.id));
    cartItems.appendChild(row);
  });
  const sub = items.reduce((a,b)=> a+b.price*b.qty,0);
  const disc = discount(items);
  subEl.textContent = fmtIDR(sub);
  const hasDisc = disc>0;
  discEl.textContent = hasDisc? ('-'+fmtIDR(disc)) : '-';
  const totals = sub - disc + (items.length? ship:0);
  shipEl.textContent = items.length? fmtIDR(ship) : 'Rp0';
  totalEl.textContent = fmtIDR(totals);
}
function addToCart(p, qty=1){
  if(p.stock<=0){ alert('Maaf, stok habis.'); return; }
  const items = readCart();
  const f = items.find(i=>i.id===p.id);
  if(f) f.qty += qty; else items.push({id:p.id, name:p.name, price:p.price, img:p.img, qty});
  writeCart(items); renderCart(); openCart();
}
function updateQty(id, qty){
  const items = readCart(); const it = items.find(i=>i.id===id); if(!it) return;
  it.qty = Math.max(1, qty); writeCart(items); renderCart();
}
function removeFromCart(id){ writeCart(readCart().filter(i=>i.id!==id)); renderCart(); }
function openCart(){ cartDrawer.classList.add('open'); }
function closeCartDrawer(){ cartDrawer.classList.remove('open'); }
cartBtn.addEventListener('click', openCart); closeCart.addEventListener('click', closeCartDrawer);
renderCart();

// Checkout (robust open/close)
const coBtn = qs('#checkout-btn'); const modal = qs('#checkout-modal');
const modalCard = qs('.modal-card', modal);
const closeCo = qs('#close-checkout'); const form = qs('#checkout-form');
const done = qs('#checkout-done'); const finishBtnId = 'finish';

const sumItems = qs('#sum-items'); const sumSub=qs('#sum-sub'); const sumDisc=qs('#sum-disc'); const sumShip=qs('#sum-ship'); const sumTotal=qs('#sum-total');

function openModal(){
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  // trap focus basic
  setTimeout(()=> qs('input[name="name"]', modal)?.focus(), 50);
}
function closeModal(){
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
}
coBtn.addEventListener('click', ()=>{
  const items = readCart(); if(!items.length){ alert('Keranjang kosong 🙂'); return; }
  sumItems.innerHTML=''; items.forEach(it=>{
    const div=document.createElement('div'); div.className='summary-row';
    div.innerHTML=`<span>${it.name} × ${it.qty}</span><strong>${fmtIDR(it.price*it.qty)}</strong>`; sumItems.appendChild(div);
  });
  const sub = items.reduce((a,b)=> a+b.price*b.qty,0); const disc = discount(items);
  sumSub.textContent = fmtIDR(sub); sumDisc.textContent = '-'+fmtIDR(disc);
  sumShip.textContent = fmtIDR(10000); sumTotal.textContent = fmtIDR(sub-disc+10000);
  done.hidden=true; form.hidden=false;
  openModal();
});
closeCo.addEventListener('click', closeModal);
// close on overlay click
modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
// prevent bubbling from card
modalCard.addEventListener('click', e=> e.stopPropagation());
// close on Esc
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  done.hidden=false; form.hidden=true;
  localStorage.setItem(CART_KEY,'[]'); renderCart();
  // ensure finish button exists before binding
  const fin = document.getElementById(finishBtnId);
  if(fin){ fin.onclick = ()=>{ done.hidden=true; form.hidden=false; form.reset(); closeModal(); }; }
});

// Testimoni
const TKEY='cu_testi_v2';
const readT = ()=> JSON.parse(localStorage.getItem(TKEY)||'[]');
const writeT = t=> localStorage.setItem(TKEY, JSON.stringify(t));
const tList = qs('#testi-list'); const tForm = qs('#testi-form');
function renderTesti(){
  const data = readT();
  tList.innerHTML='';
  if(!data.length){
    tList.innerHTML = '<div class="item">Belum ada testimoni. Jadilah yang pertama!</div>'; return;
  }
  data.forEach(x=>{
    const el = document.createElement('div');
    el.className='item';
    el.innerHTML = `<strong>${x.name}</strong> — ${'★'.repeat(+x.rate)}${'☆'.repeat(5-+x.rate)}<p>${x.msg}</p>`;
    tList.appendChild(el);
  });
}
tForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(tForm);
  const x = {name: (fd.get('name')||'').toString().trim() || 'Anon', rate: fd.get('rate'), msg: (fd.get('msg')||'').toString()};
  writeT([...readT(), x]); tForm.reset(); renderTesti();
});
renderTesti();

// Kritik & Saran
const sForm = qs('#saran-form'); const sStatus = qs('#saran-status');
sForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  sStatus.textContent = 'Terima kasih! Saran kamu sudah dicatat (simulasi).';
  sForm.reset();
});
