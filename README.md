# DigitalSafaris

> Your concierge, reimagined.

DigitalSafaris is a multi-sided platform that connects customers with accommodation, restaurant, and transport partners — all in one seamless digital concierge experience.

---

## Project Structure

| Folder | Description | Port |
| :--- | :--- | :--- |
| `backend/` | MERN API (Node.js + Express + MongoDB + Redis + Socket.IO) | 5000 |
| `admin/` | Admin Dashboard (Vite + React + TypeScript + Tailwind) | 3001 |
| `app/` | Customer App (Vite + React + TypeScript + Tailwind) | 3000 |
| `partner/` | Partner Dashboard (Vite + React + TypeScript + Tailwind) | 3002 |
| `website/` | Public Marketing Website (Vite + React + TypeScript + Tailwind) | 3003 |

---

## The Digital Quad

DigitalSafaris operates on four pillars:

1. **Customer** — Books accommodation, orders food, requests transport, uses AI concierge.
2. **Website/App** — The interface. Browse & book, request & fulfill, track & pay.
3. **Server** — The central brain. Manages escrow, wallets, broadcasts, payouts, AI.
4. **Partners** — Accommodation, Restaurant, Transport. Fulfill orders and earn.

---

## Core Features

### Customer
- Browse & book accommodation
- Order food (delivery or dine-in booking)
- Request transport (airport transfer, game drive, local rides)
- AI Concierge for natural language requests
- Live tracking of orders and drivers
- Wallet, payments, reviews, notifications

### Partners
- **Accommodation:** Browse & book model (property, rooms, availability, bookings, guests)
- **Restaurant:** Broadcast & accept model (menu, orders, dine-in bookings, broadcasts)
- **Transport:** Broadcast & accept model (vehicle, jobs, trips, location, ratings)

### Admin
- Dashboard, Admins, Customers, Partners (3 tabs)
- Operations (bookings, food orders, trips, broadcasts)
- Payments (list, commissions, payouts), Payment Methods, Wallets
- Disputes, Reports, Settings (legal, branding, backups)

---

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Redis (caching, broadcast queue, sessions)
- Socket.IO (real-time tracking, live updates)
- Cloudinary (image uploads)
- M-Pesa Daraja API (payments + payouts)
- Stripe (card payments)
- Brevo / hdmBridge (email)
- Firebase (push notifications)
- HDM AI (AI concierge)

### Frontend (all four)
- Vite + React + TypeScript
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client

---

## Payment & Payout Model

- **Customer Payments:** M-Pesa, Airtel Money, Card, Bank Transfer, Cash on Delivery (admin toggleable)
- **Escrow:** Delivery orders are prepaid. Dine-in bookings are paid at the restaurant.
- **Wallets:** Every partner has a DS Wallet tracking earnings and commissions.
- **Commission:** 10% on food, 10% on transport, 10% on accommodation.
- **Payouts:** Auto (scheduled) + Manual (on-demand).
- **Off-Platform Tracking:** Dine-in commissions tracked via hybrid ledger and offset against delivery earnings.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- M-Pesa Daraja account
- Stripe account
- Cloudinary account
- Brevo account
- Firebase project

### Install

```bash
# Backend
cd backend
npm install

# Admin
cd admin
npm install

# App
cd app
npm install

# Partner
cd partner
npm install

# Website
cd website
npm install
```

### Run (Development)

```bash
# Backend
cd backend
npm run dev

# Admin (Port 3001)
cd admin
npm run dev

# App (Port 3000)
cd app
npm run dev

# Partner (Port 3002)
cd partner
npm run dev

# Website (Port 3003)
cd website
npm run dev
```

---

## Environment Variables

Each folder has its own `.env` file.

### Backend `.env`
```
PORT=5000
NODE_ENV=development
MONGO_URI=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRES=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
BREVO_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
HDM_AI_KEY=
HDM_BRIDGE_KEY=
```

### Frontend `.env` (each)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Scripts

### Backend
- `npm run dev` — Start with nodemon
- `npm start` — Start production
- `npm run seed` — Seed database
- `npm run admin` — Create admin user
- `npm run dns` — Configure DNS

### Frontend (each)
- `npm run dev` — Start Vite dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

---

## License

Proprietary — DigitalSafaris © 2026
