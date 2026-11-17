# Bus Pass Management System

A fully client-side Next.js application for managing student bus passes — no backend required. All data is stored in the browser (LocalStorage + IndexedDB).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

For a production build:

```bash
npm run build
npm start
```

## Demo logins

| Role    | Email              | Password |
|---------|--------------------|----------|
| Student | student@demo.com   | demo123  |
| Admin   | admin@demo.com     | demo123  |

## Full workflow

1. **Student** logs in → Apply → fill the 4-step form → submit
2. **Admin** logs in → Applications → open the application → Approve
3. **Student** → My Pass → sees the digital pass with QR code, can download PDF
4. **Admin** → Verify Pass → paste the pass ID or scan QR → result shows Valid / Invalid

## Tech stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS 3**
- **Framer Motion** – page and element animations
- **Leaflet / React-Leaflet** – interactive OSM route maps
- **Recharts** – admin overview charts
- **qrcode** – QR code generation
- **jsPDF** – downloadable pass PDF

## Notes

- Bus and campus photos are loaded from Unsplash (free CDN). If you are offline a gradient fallback is shown automatically.
- The app seeds Mumbai demo data on first load; admins can reset it from **Settings → Reset demo data**.
- No data ever leaves the browser.
