# Deploy TravelDex (Render + MongoDB Atlas)

## 1. Preserve existing data first
Before creating a new database, check the MongoDB Atlas account used by the old deployment. If the old cluster/database still exists, make a backup/export before changing anything. This code change does not migrate or delete the old database. Never run the seed script on a database with data you want to keep.

## 2. Create or locate MongoDB Atlas
1. Sign in at https://www.mongodb.com/atlas and create a free cluster if needed.
2. Create a database user with a strong password.
3. Under Network Access, allow Render to connect. If using Render free without fixed outbound IPs, Atlas may require `0.0.0.0/0`; use a strong database password and a least-privilege database user.
4. Select Connect > Drivers and copy the connection string.
5. Replace username, password, and database name (for example `traveldex`). URL-encode special characters in the password. Keep this URI private.

## 3. Prepare Cloudinary and Mapbox
- Cloudinary: obtain cloud name, API key, and API secret at https://cloudinary.com/console.
- Mapbox: create a public `pk.` token at https://account.mapbox.com/access-tokens/. Restrict its allowed URLs to the Render domain after deployment. Never put a secret `sk.` token in browser code.

## 4. Deploy on Render
1. Review and merge the `deployment-ready` pull request, or select that branch directly when creating the service.
2. Sign in at https://render.com/ and select New > Web Service.
3. Connect GitHub and choose `nhwoo97/travelDex`.
4. Select branch `deployment-ready` (or `main` after merging).
5. Configure:
   - Runtime: Node
   - Build command: `npm install && npm run check && npm test`
   - Start command: `npm start`
   - Health check path: `/health`
   - Instance: Free (if offered for your account)
6. Add environment variables:
   - `NODE_ENV` = `production`
   - `DB_URL` = MongoDB Atlas connection string
   - `SESSION_SECRET` = unique random value at least 32 characters long
   - `CLOUDINARY_CLOUD_NAME` = Cloudinary cloud name
   - `CLOUDINARY_KEY` = Cloudinary API key
   - `CLOUDINARY_SECRET` = Cloudinary API secret
   - `MAPBOX_TOKEN` = Mapbox public `pk.` token
7. Deploy and inspect the Render build/start logs.
8. Visit `https://YOUR-SERVICE.onrender.com/health`. Expected response: `{"status":"ok"}`.
9. Test registration, login/logout, location creation/edit/deletion, map display, image uploads, and reviews.

## 5. After deployment
1. Add your final Render domain to Mapbox token URL restrictions.
2. Confirm Atlas Network Access permits the Render service.
3. Keep secrets only in Render environment variables, never in Git.
4. Back up MongoDB periodically.
5. Render free services may spin down when idle; the first request after inactivity can be slow. Local disk is ephemeral, so uploads are stored in Cloudinary.

## Troubleshooting
- Missing environment variable: verify Render environment settings and redeploy.
- MongoServerSelectionError: check Atlas URI, database user/password, URL encoding, and network access.
- Blank map: verify Mapbox public token and URL restrictions.
- Upload failure: verify Cloudinary credentials and usage.
- Login not persisting: check session secret, HTTPS, and MongoDB session collection.
- Build failure: inspect the first npm error in Render logs. Use `npm install` to refresh the old lockfile; do not use `npm ci` until a regenerated lockfile is committed.

## Sample data
The seed script deletes existing campground records. It refuses to run unless `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set and uses the first registered user as the sample author. Do not run it against a database with data to preserve.
