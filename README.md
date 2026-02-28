# Light Inventory Scanner

Mobile-first barcode scanner for warehouse inventory. Quickly catalog inventory with camera scanning, photos, and quantity tracking.

**Built with:** React 18 • Vite 6 • Supabase • BarcodeDetector API

## Features

- **Barcode scanning** — Camera-based detection with manual entry fallback
- **Duplicate detection** — Scan existing barcodes to add more or edit
- **Photo support** — Capture/upload multiple photos per product with client-side compression
- **Search & pagination** — Browse inventory efficiently with barcode/notes/location search
- **Password protection** — Simple PIN entry gate
- **Smart defaults** — Location carries forward between scans
- **Cloud backend** — All data stored in Postgres with Supabase

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- A [Supabase](https://supabase.com) account (compatible w free version)

### Setup

**1. Clone & install**
```bash
git clone https://github.com/vtrmdz/light-inventory-scanner
cd light-inventory-scanner
npm install
```

**2. Create Supabase database**
- Go to [supabase.com](https://supabase.com) → New Project
- Open **SQL Editor** → paste `supabase-setup.sql` → Run
- Go to **Settings → API** → copy **Project URL** and **anon public key**

**3. Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_APP_PASSWORD=yourpassword
```

**4. Run locally**
```bash
npm run dev
```
Open the URL on your phone (must be on same network), or deploy it.

**5. Build & deploy** (optional)
```bash
npm run build
```
Deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or any static host.

## How It Works

**New barcode** → Form appears → Add quantity + photos + location → Save

**Existing barcode** → "Add More" mode opens → Choose: add quantity OR edit entire entry

Barcodes are unique, so no duplicates are ever created.

## Image Compression

Photos are automatically compressed before upload:
- **Max size:** 1600px longest side (preserves SKU readability)
- **Quality:** 75% JPEG
- **Result:** ~4MB phone photo → ~180KB

Saves bandwidth and storage

## Stack

| Part | Technology |
|------|-----------|
| Frontend | React 18.3 + Vite 6 |
| Backend | Supabase (Postgres) |
| Barcode | BarcodeDetector API |
| Images | Client-side compression + Supabase Storage |

## Database Schema

| Column | Type | Note |
|--------|------|------|
| id | UUID | Auto-generated |
| barcode | TEXT UNIQUE | Scanned code (prevents duplicates) |
| quantity | INTEGER | Total on hand |
| notes | TEXT | Free-form notes |
| location | TEXT | Shelf/bin/pallet |
| photos | TEXT[] | Photo URLs |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Browser Support

Camera barcode scanning requires [BarcodeDetector API](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector):

| Browser | OS | Status |
|---------|-------|------|
| Chrome | Android | ✅ Works |
| Safari | iOS 16.4+ | ✅ Works |
| Firefox | Any | ⚠️ Manual entry only |

Manual entry always works as fallback.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Test production build
```

## License

MIT
