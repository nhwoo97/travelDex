# TravelDex

TravelDex is a server-rendered travel and campground discovery application built with Express, EJS, MongoDB/Mongoose, Passport, Cloudinary, and Mapbox.

## Features
- Share places with photos, a category, tags and the date you visited; they're geocoded onto a map.
- Browse at `/places` with search (name, city, tag), category and rating filters, sorting and pagination, alongside a clustered map that highlights the card you hover.
- Star reviews you can edit or delete; each place shows its average rating.
- Public traveler profiles at `/users/<username>` listing a user's places, reviews and want-to-go list. Every username links there.
- Save places to a "want to go" list.

Old `/campgrounds/...` links redirect to `/places/...`. On startup the app backfills older data (categories, rating totals, review-to-place links); this is idempotent.

## Requirements
- Node.js 24 LTS and npm
- MongoDB Atlas (or a MongoDB server)
- Cloudinary account for image uploads
- Mapbox public access token for maps and geocoding

## Run locally
1. Copy `.env.example` to `.env` and fill in credentials.
2. Install dependencies with `npm install`.
3. Start with `npm start`.
4. Visit http://localhost:3000.

The application requires `DB_URL` and `SESSION_SECRET`. Mapbox is needed for location geocoding/maps; Cloudinary is needed for image uploads.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Render deployment instructions.

## Scripts
- `npm start`: start the server
- `npm test`: run smoke tests
- `npm run check`: check JavaScript syntax
- `npm run seed`: destructive sample-data seeding (requires explicit opt-in)

Do not seed a database containing data you want to preserve.
