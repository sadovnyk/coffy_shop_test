# Umber Coffee

A small coffee shop website with a working menu, cart and checkout. Products, customers and orders are stored in PostgreSQL.

- **Frontend:** HTML, CSS and vanilla JavaScript (white and brown theme, SVG images)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Deployment:** Docker Compose (optional nginx in front)

## Features

- Menu loaded from the database, with filters for hot drinks, cold drinks and beans
- Cart drawer with quantity controls
- Checkout that saves the customer and the order in Postgres
- Prices are always read from the database, never trusted from the browser
- Fallback menu if the API is unreachable (orders won't work in that case)

## Project structure

```
coffee-shop/
├── server.js             Express API + static file server
├── package.json          dependencies and scripts
├── package-lock.json     exact dependency versions (created by npm install)
├── .env.example          template for your local settings
├── .gitignore
├── Dockerfile            builds the Node app image
├── .dockerignore
├── docker-compose.yml    app + Postgres
├── db/
│   └── schema.sql        tables and sample data
└── public/
    ├── index.html
    ├── style.css
    ├── script.js
    └── images/           logo.svg, cup.svg, latte.svg, beans.svg
```

## Database

| Table | Purpose |
|---|---|
| `products` | menu items: name, category (`hot`, `cold`, `beans`), description, price in cents, image, `in_stock` |
| `customers` | name, unique email, phone |
| `orders` | one row per order, linked to a customer, with total and status |
| `order_items` | products and quantities in each order |

## Run with Docker

Requirements: Docker and Docker Compose.

1. Create a `.env` file with the database password:
   ```
   DB_PASSWORD=choose_a_strong_password
   ```
2. Build and start everything:
   ```
   docker compose up -d --build
   ```
3. Open http://localhost:3000

On the first start, Postgres runs `db/schema.sql` automatically. Data is stored in the `pgdata` volume, so it survives restarts and rebuilds.


## Working with Postgres in the console

```
docker compose exec db psql -U postgres -d coffee_shop
```

| Command | What it does |
|---|---|
| `\dt` | list tables |
| `\d products` | show table columns |
| `\x` | toggle vertical output |
| `\q` | quit |

Examples:
```sql
SELECT name, price_cents FROM products;
UPDATE products SET price_cents = 300 WHERE name = 'Espresso';
UPDATE products SET in_stock = false WHERE id = 3;   -- hide from the menu

SELECT o.id, c.name, o.total_cents, o.created_at
FROM orders o JOIN customers c ON c.id = o.customer_id
ORDER BY o.created_at DESC;
```
Always use `WHERE` with `UPDATE` and `DELETE`.

Backup and restore:
```
pg_dump -U postgres -h localhost coffee_shop > backup.sql
psql -U postgres -h localhost -d coffee_shop -f backup.sql
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'dotenv'` | run `npm install` |
| `Cannot GET /` | `index.html`, `style.css`, `script.js` and `images/` must be inside the `public/` folder |
| `client password must be a string` | `.env` is missing or `DATABASE_URL` has no password. Create `.env` and restart |
| `password authentication failed` | wrong password. Reset it with `ALTER USER postgres PASSWORD '...'` |
| `connection refused` | Postgres is not running: `sudo service postgresql start` |
| `psql: No existing cluster...` | PostgreSQL itself is not installed: `sudo apt install postgresql` |
| Docker: schema not loaded | the volume already existed. Run `docker compose down -v` and start again (deletes data) |
| Menu shows only 4 items | the API is unreachable, so the fallback menu is shown. Check the server and database |
