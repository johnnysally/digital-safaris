# Digital Safaris Partner Portal

React and TypeScript portal for accommodation, restaurant, and transport partners.

## Development

From this directory:

```sh
npm install
npm run dev
```

Set `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_WEBSITE_URL` in a local `.env` file when the default local service URLs are not appropriate. Do not commit secrets or production credentials.

## Quality checks

```sh
npm run lint
npm test
npm run build
```

Portal landing and role-specific application code is loaded on demand by route.