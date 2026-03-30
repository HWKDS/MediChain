# MediChain deployment guide (hwkds.dev)

This project should use:

- Frontend: GitHub Pages at https://medichain.hwkds.dev
- Backend: Render at https://api.hwkds.dev

## 1) Frontend setup (already prepared in code)

Configured files:

- [medichain-frontend/package.json](medichain-frontend/package.json) (`homepage` is `https://medichain.hwkds.dev`)
- [medichain-frontend/public/CNAME](medichain-frontend/public/CNAME) (`medichain.hwkds.dev`)
- [medichain-frontend/public/config.js](medichain-frontend/public/config.js) (`window.API_URL = "https://api.hwkds.dev/api"`)

Deploy command:

1. Open terminal in `medichain-frontend`
2. Run:
   - `npm install`
   - `npm run deploy`

This publishes to the `gh-pages` branch.

## 2) GitHub Pages settings

In GitHub repo settings:

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages**
4. Folder: **/ (root)**
5. Custom domain: **medichain.hwkds.dev**
6. Enable **Enforce HTTPS** (after DNS is valid)

## 3) DNS for frontend (medichain.hwkds.dev)

At your DNS provider for `hwkds.dev`, add:

- Type: `CNAME`
- Name/Host: `medichain`
- Target/Value: `HWKDS.github.io`

## 4) Deploy backend to Render

Create a new **Web Service** on Render from this repo.

Use these settings:

- Root directory: project root (`MediChain`)
- Build command: `npm install`
- Start command: `node medichain-backend/server.js`

Set environment variables in Render:

- `CONTRACT_ADDRESS` = deployed contract address
- `RPC_URL` = public RPC endpoint URL
- `PRIVATE_KEY` = wallet private key for transactions
- `CORS_ORIGINS` = `https://medichain.hwkds.dev,https://hwkds.dev,https://www.hwkds.dev`

Then deploy and copy the Render service URL (example: `https://medichain-api.onrender.com`).

## 5) DNS for backend (api.hwkds.dev)

In Render service settings, add custom domain: `api.hwkds.dev`.

Render will show a DNS target. Add it in DNS:

- Type: `CNAME`
- Name/Host: `api`
- Target/Value: `<value provided by Render>`

Wait for Render domain verification.

## 6) Update flow after code changes

Frontend update:

1. Push frontend code
2. Run `npm run deploy` inside `medichain-frontend`
3. Wait 1–5 minutes for Pages cache/deploy

Backend update:

1. Push backend code to connected branch
2. Render auto-deploys
3. Verify `https://api.hwkds.dev/api/test`

## 7) Quick validation checklist

- App opens: `https://medichain.hwkds.dev`
- API test works: `https://api.hwkds.dev/api/test`
- Browser console shows API URL from [medichain-frontend/public/config.js](medichain-frontend/public/config.js)
- No CORS errors in browser network tab
