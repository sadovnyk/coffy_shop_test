-- Run: psql -U postgres -c "CREATE DATABASE coffee_shop;" && psql -U postgres -d coffee_shop -f db/schema.sql
DROP TABLE IF EXISTS order_items, orders, products, customers CASCADE;

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(30),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  category     VARCHAR(30)  NOT NULL CHECK (category IN ('hot','cold','beans')),
  description  TEXT,
  price_cents  INTEGER NOT NULL CHECK (price_cents > 0),
  image_url    VARCHAR(200),
  in_stock     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  total_cents  INTEGER NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        INTEGER NOT NULL REFERENCES products(id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents  INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO products (name, category, description, price_cents, image_url) VALUES
 ('Espresso',        'hot',   'Double shot, thick crema, dark chocolate finish.',  280, 'images/cup.svg'),
 ('Flat White',      'hot',   'Velvety microfoam over a ristretto base.',          400, 'images/latte.svg'),
 ('Cappuccino',      'hot',   'Equal parts espresso, steamed milk and foam.',      390, 'images/latte.svg'),
 ('Caramel Latte',   'hot',   'Espresso, steamed milk and house caramel.',         460, 'images/latte.svg'),
 ('Cold Brew',       'cold',  'Steeped 18 hours, served over ice.',                430, 'images/cup.svg'),
 ('Iced Mocha',      'cold',  'Espresso, cocoa and cold milk over ice.',           480, 'images/latte.svg'),
 ('House Blend 250g','beans', 'Medium roast: hazelnut, cocoa, brown sugar.',      1400, 'images/beans.svg'),
 ('Ethiopia 250g',   'beans', 'Light roast: blueberry, jasmine, citrus.',         1650, 'images/beans.svg');

INSERT INTO customers (name, email, phone) VALUES
 ('Anna Brown',  'anna@example.com',  '+1 555 0101'),
 ('Marco Rossi', 'marco@example.com', '+1 555 0102');
