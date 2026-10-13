// Fallback menu, used only if the API / database is unreachable (e.g. opening index.html directly).
const FALLBACK = [
  {id:1,name:'Espresso',category:'hot',description:'Double shot, thick crema, dark chocolate finish.',price_cents:280,image_url:'images/cup.svg'},
  {id:2,name:'Flat White',category:'hot',description:'Velvety microfoam over a ristretto base.',price_cents:400,image_url:'images/latte.svg'},
  {id:5,name:'Cold Brew',category:'cold',description:'Steeped 18 hours, served over ice.',price_cents:430,image_url:'images/cup.svg'},
  {id:7,name:'House Blend 250g',category:'beans',description:'Medium roast: hazelnut, cocoa, brown sugar.',price_cents:1400,image_url:'images/beans.svg'}
];

const $ = s => document.querySelector(s);
const money = c => '$' + (c / 100).toFixed(2);
let products = [], cart = {}, category = 'all';

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error();
    products = await res.json();
  } catch { products = FALLBACK; }
  renderProducts();
}

function renderProducts() {
  const list = products.filter(p => category === 'all' || p.category === category);
  $('#products').innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      <div class="card-body">
        <h3>${p.name}</h3><p>${p.description || ''}</p>
        <div class="card-foot"><span class="price">${money(p.price_cents)}</span>
        <button class="add" data-id="${p.id}">Add to cart</button></div>
      </div>
    </article>`).join('') || '<p>Nothing here yet.</p>';
}

function renderCart() {
  const rows = Object.entries(cart).map(([id, qty]) => ({ p: products.find(x => x.id == id), qty }));
  $('#cartItems').innerHTML = rows.map(({ p, qty }) => `
    <li><span>${p.name}<br><small>${money(p.price_cents)}</small></span>
    <span class="qty"><button data-dec="${p.id}" aria-label="Remove one ${p.name}">−</button>${qty}
    <button data-inc="${p.id}" aria-label="Add one ${p.name}">+</button></span></li>`).join('')
    || '<li class="empty">Your cart is empty. Add a drink from the menu.</li>';
  $('#cartTotal').textContent = money(rows.reduce((s, r) => s + r.p.price_cents * r.qty, 0));
  $('#cartCount').textContent = rows.reduce((s, r) => s + r.qty, 0);
}

function change(id, d) {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}

function toggleDrawer(open) {
  $('#drawer').classList.toggle('open', open);
  $('#scrim').classList.toggle('show', open);
  $('#drawer').setAttribute('aria-hidden', !open);
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.cat) {
    category = t.dataset.cat;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === t));
    renderProducts();
  }
  if (t.classList.contains('add')) { change(t.dataset.id, 1); toggleDrawer(true); }
  if (t.dataset.inc) change(t.dataset.inc, 1);
  if (t.dataset.dec) change(t.dataset.dec, -1);
});
$('#openCart').onclick = () => toggleDrawer(true);
$('#closeCart').onclick = $('#scrim').onclick = () => toggleDrawer(false);
document.addEventListener('keydown', e => e.key === 'Escape' && toggleDrawer(false));

$('#checkout').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#msg'); msg.className = '';
  if (!Object.keys(cart).length) { msg.className = 'err'; msg.textContent = 'Add at least one item first.'; return; }
  const f = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, items: Object.entries(cart).map(([id, qty]) => ({ id: +id, qty })) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    msg.textContent = `Thank you! Order #${data.orderId} is placed (${money(data.total_cents)}).`;
    cart = {}; renderCart(); e.target.reset();
  } catch (err) {
    msg.className = 'err';
    msg.textContent = err.message || 'Could not reach the server. Start it with "npm start".';
  }
});

$('#year').textContent = new Date().getFullYear();
renderCart();
loadProducts();
