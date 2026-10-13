require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// List products
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, category, description, price_cents, image_url FROM products WHERE in_stock ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

// Place an order: creates (or updates) the customer, then the order and its items.
// Prices are always read from the database, never trusted from the browser.
app.post('/api/orders', async (req, res) => {
  const { name, email, phone, items } = req.body || {};
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Enter your name, a valid email and at least one item.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cust = await client.query(
      `INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, customers.phone)
       RETURNING id`,
      [name.trim(), email.trim().toLowerCase(), phone || null]
    );
    const ids = items.map(i => Number(i.id));
    const prod = await client.query('SELECT id, price_cents FROM products WHERE id = ANY($1) AND in_stock', [ids]);
    const prices = new Map(prod.rows.map(p => [p.id, p.price_cents]));
    let total = 0;
    const lines = items.map(i => {
      const price = prices.get(Number(i.id));
      const qty = Math.max(1, Math.min(50, parseInt(i.qty, 10) || 1));
      if (price === undefined) throw new Error('Unknown product');
      total += price * qty;
      return { id: Number(i.id), qty, price };
    });
    const order = await client.query(
      'INSERT INTO orders (customer_id, total_cents) VALUES ($1, $2) RETURNING id',
      [cust.rows[0].id, total]
    );
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1, $2, $3, $4)
         ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity`,
        [order.rows[0].id, l.id, l.qty, l.price]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ orderId: order.rows[0].id, total_cents: total });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not place the order. Try again.' });
  } finally {
    client.release();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Coffee shop running at http://localhost:${port}`));
