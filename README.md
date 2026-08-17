# Task & Inventory Management System

A full-stack app to manage personal tasks and inventory stock, with user accounts and secure login.

## Features
- Sign up / log in (JWT auth, hashed passwords)
- Create, update, complete, and delete tasks (priority, due date, status)
- Track inventory items with quantity, price, and low-stock alerts
- Each user only sees their own data

## Tech Stack
React (Vite) · Node.js / Express · PostgreSQL · Docker · AWS (EC2 + RDS)

## Run Locally
```bash
docker compose up --build
```
Then open **http://localhost:8080**.

## API Overview
| Endpoint | Description |
|---|---|
| POST /api/auth/register, /login | Create account / sign in |
| GET/POST/PUT/DELETE /api/tasks | Manage tasks |
| GET/POST/PUT/DELETE /api/inventory | Manage inventory |

All routes except auth require a Bearer token.
