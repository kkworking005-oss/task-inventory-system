# Task & Inventory Management System

A full-stack web app for tracking tasks and inventory stock levels, with per-user accounts and JWT authentication.

## Tech Stack

- **Frontend:** React 18 (Vite), React Router
- **Backend:** Node.js, Express, JWT auth, bcrypt password hashing
- **Database:** PostgreSQL
- **Infra:** Docker, Docker Compose, deployable to AWS (EC2 + RDS)

## Features

- User registration/login with hashed passwords and JWT sessions
- Task CRUD: title, description, priority, due date, status (pending/in progress/completed)
- Inventory CRUD: SKU, quantity, unit price, automatic low-stock flagging
- All data scoped per user (no cross-user data leakage)
- Dockerized for one-command local setup and easy cloud deployment

## Project Structure

```
task-inventory-system/
├── backend/            # Express REST API
│   ├── src/
│   │   ├── config/     # DB connection + schema.sql
│   │   ├── middleware/ # JWT auth middleware
│   │   ├── routes/     # auth, tasks, inventory routes
│   │   └── server.js
│   └── Dockerfile
├── frontend/           # React app (Vite)
│   ├── src/
│   │   ├── api/        # fetch wrapper
│   │   ├── context/    # AuthContext
│   │   ├── components/ # TasksPanel, InventoryPanel, ProtectedRoute
│   │   └── pages/      # Login, Register, Dashboard
│   └── Dockerfile
└── docker-compose.yml
```

---

## Option A: Run Locally with Docker (fastest)

Requires Docker + Docker Compose installed.

```bash
git clone <your-repo-url>
cd task-inventory-system
docker compose up --build
```

This starts three containers: Postgres (5432), backend API (5000), frontend (8080).

Open **http://localhost:8080**, register an account, and start using the app.

To stop: `docker compose down` (add `-v` to also wipe the database volume).

---

## Option B: Run Locally without Docker

**1. Database**
```bash
# Install Postgres, then create the database
createdb task_inventory
psql -d task_inventory -f backend/src/config/schema.sql
```

**2. Backend**
```bash
cd backend
cp .env.example .env      # edit DB credentials if needed
npm install
npm start                 # runs on http://localhost:5000
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                # runs on http://localhost:5173
```

---

## Option C: Deploy to AWS (EC2 + RDS) — Free Tier

This is the recommended path since it demonstrates real AWS deployment skills.

### Step 1 — Create an RDS PostgreSQL database
1. AWS Console → RDS → **Create database**
2. Engine: PostgreSQL, Template: **Free tier**
3. DB instance identifier: `task-inventory-db`
4. Set a master username/password (save these)
5. Under connectivity, note the **public access** setting — enable it for simplicity (restrict via security group instead in production)
6. Create the database, wait for status "Available", copy the **endpoint** (looks like `task-inventory-db.xxxxx.rds.amazonaws.com`)
7. In the RDS security group, add an inbound rule allowing PostgreSQL (port 5432) from your EC2 instance's security group (Step 2)

### Step 2 — Launch an EC2 instance
1. EC2 → **Launch instance**
2. AMI: Ubuntu Server 24.04, Instance type: **t2.micro** (free tier eligible)
3. Create/select a key pair (needed for SSH)
4. Security group: allow inbound **SSH (22)**, **HTTP (80)**, and **custom TCP 5000** from your IP / anywhere
5. Launch, then note the instance's **public IPv4 address**

### Step 3 — SSH in and install dependencies
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt update && sudo apt install -y nodejs npm postgresql-client git
# If the apt nodejs version is old, install via nvm instead:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### Step 4 — Deploy the backend
```bash
git clone <your-repo-url>
cd task-inventory-system/backend
npm install

# Point at RDS
cat > .env << EOF
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
DB_HOST=<your-rds-endpoint>
DB_PORT=5432
DB_USER=<your-rds-username>
DB_PASSWORD=<your-rds-password>
DB_NAME=task_inventory
DB_SSL=true
EOF

# Load schema into RDS (run once)
PGPASSWORD=<password> psql -h <rds-endpoint> -U <username> -d postgres -c "CREATE DATABASE task_inventory;"
PGPASSWORD=<password> psql -h <rds-endpoint> -U <username> -d task_inventory -f src/config/schema.sql

# Keep it running with pm2
npm install -g pm2
pm2 start src/server.js --name task-inventory-api
pm2 startup && pm2 save
```

Verify: `curl http://<EC2_PUBLIC_IP>:5000/api/health` should return `{"status":"ok",...}`.

### Step 5 — Deploy the frontend
Easiest: build locally with the EC2 IP baked in, then serve from the same EC2 box via nginx.

```bash
# On your local machine, inside frontend/
echo "VITE_API_URL=http://<EC2_PUBLIC_IP>:5000/api" > .env
npm run build

# Copy the build to EC2
scp -i your-key.pem -r dist/* ubuntu@<EC2_PUBLIC_IP>:~/frontend-build

# On EC2: install nginx and serve it
sudo apt install -y nginx
sudo cp -r ~/frontend-build/* /var/www/html/
sudo systemctl restart nginx
```

Your live app is now at **http://<EC2_PUBLIC_IP>** (frontend) talking to port 5000 (API).

### Step 6 — (Optional) HTTPS + custom domain
Point a free domain (e.g. Freenom, or a subdomain from a service you already own) at the EC2 IP, then use **Certbot** (`sudo apt install certbot python3-certbot-nginx`) to get a free Let's Encrypt SSL certificate.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account, returns JWT |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/tasks` | Yes | List current user's tasks |
| POST | `/api/tasks` | Yes | Create a task |
| PUT | `/api/tasks/:id` | Yes | Update a task |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |
| GET | `/api/inventory` | Yes | List current user's inventory |
| POST | `/api/inventory` | Yes | Create an item |
| PUT | `/api/inventory/:id` | Yes | Update an item |
| DELETE | `/api/inventory/:id` | Yes | Delete an item |

Authenticated requests need header: `Authorization: Bearer <token>`

## Security Notes
- Passwords hashed with bcrypt (10 salt rounds)
- JWT expires after 7 days
- All task/inventory queries filtered by `user_id` server-side — users can't access each other's data even by guessing IDs
- Never commit real `.env` files — `.env.example` shows required variables only
