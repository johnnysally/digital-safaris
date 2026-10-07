# Digital Safaris — Admin Panel

Internal control center for the Digital Safaris platform.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (brand palette: `primary #1A1F2E`, `secondary #C9A063`)
- React Router
- Axios (JWT access + refresh)
- Socket.IO client (admin room)

## Ports

| Service  | Port |
| -------- | ---- |
| Frontend | 3001 |
| Backend  | 5000 |

Dev server proxies `/api` → `http://localhost:5000`.

## Setup

```bash
npm install
cp .env.example .env   # or create .env manually
npm run dev
```

Runs at http://localhost:3001

## Environment

Create `admin/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Scripts

| Script          | Does                     |
| --------------- | ------------------------ |
| `npm run dev`   | Start dev server (3001)  |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint`  | ESLint                   |

## Structure

See the **Developer Guide** for the full architecture: `src/api`, `src/context`,
`src/components/ui`, `src/components/layout`, `src/pages`, `src/routes`,
`src/utils`.

## Branding

Runtime branding (logo, colors, font, meta) is managed in
**Settings → Branding** and injected as CSS variables on `<html>`:
`--ds-primary`, `--ds-secondary`, `--ds-font`, `--ds-logo`, `--ds-favicon`.