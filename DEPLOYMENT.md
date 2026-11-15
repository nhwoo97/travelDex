# Deploy TravelDex (Render + MongoDB Atlas)

This guide deploys the Express/EJS application from the `main` branch. Do not use Render Static Site: TravelDex runs a Node.js server.

## 1. Preserve existing data before creating a database

1. Sign in to the MongoDB Atlas account used by the old TravelDex/YelpCamp deployment.
2. Check whether the old project/cluster still exists and whether the `yelp-camp` database contains records.
3. If the old database exists and contains data you want to keep, back it up before deploying. Reuse that cluster/connection string rather than creating an empty replacement.
4. Do not run `npm run seed` against a database with data you want to preserve. The seed script intentionally deletes all campground records after explicit opt-in.

## 2. Create or locate the MongoDB Atlas database

If the old cluster is unavailable or you deliberately want a fresh database:

1. Open https://cloud.mongodb.com/ and select your project.
2. Create a Free cluster (M0) if needed. Choose a cloud provider and region close to the Render region you select. The current Blueprint does not pin a Render region, so choose the Render region first, then select a nearby Atlas region where possible.
3. Create a **database user** (this is different from your Atlas website login). Give it read/write access to the intended application database, use a strong unique password, and save the credentials privately.
4. Open Network Access / IP Access List. Render documents its regional outbound IP ranges; after Render creates the service, open the service's **Connect → Outbound** panel and add those CIDR ranges to Atlas. If you need to get the first deployment running before you can copy the ranges, you can temporarily allow `0.0.0.0/0`, then replace that rule with the Render outbound ranges as soon as the service is created. Keep database authentication enabled and use a strong password.
5. On the cluster, select Connect → Drivers (or Connect your application), choose Node.js, and copy the connection URI.
6. Insert the database name in the path after `.mongodb.net/`. Use `traveldex` for a new database, or `yelp-camp` if you are intentionally reconnecting to the original database. Keep the query string after the database name, for example:
   ```
   mongodb+srv://DB_USER:DB_PASSWORD@your-cluster.mongodb.net/traveldex?retryWrites=true&w=majority
   ```
7. Replace the username and password. URL-encode any special characters in the password. Do not post the connection string in GitHub or chat.

Atlas connection instructions: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/

## 3. Prepare Cloudinary and Mapbox

### Cloudinary (image uploads)

1. Sign in at https://cloudinary.com/console/.
2. On the Dashboard, locate the Product Environment's **Cloud name**.
3. Open Settings → API Keys to find the API key and reveal/copy the API secret.
4. Reuse your original Cloudinary account if you still have it and want to continue using the same media account. Keep the API secret private.

### Mapbox (maps and location lookup)

1. Sign in at https://account.mapbox.com/access-tokens/.
2. Create a **public** token beginning with `pk.`; do not use a secret `sk.` token in the browser.
3. The current app uses the same `MAPBOX_TOKEN` for the browser map and server-side geocoding. Start with the required read-only map/geocoding scopes and leave URL restrictions off for the first deployment; a browser-referrer restriction can block the server-side geocoding request. Once the site is tested, the code can be adjusted to use separate browser/server tokens so the browser token can be URL-restricted.

Cloudinary credential help: https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials
Mapbox token security: https://docs.mapbox.com/help/dive-deeper/access-tokens/

## 4. Create the Render Blueprint

The repository already has a root-level `render.yaml` Blueprint definition.

1. Open https://dashboard.render.com/.
2. Connect your GitHub account under Render's Git deployment settings if you have not done so.
3. From the Render Dashboard choose **New → Blueprint** (not Static Site).
4. Select the `nhwoo97/travelDex` repository and the `main` branch.
5. Render should detect `render.yaml` at the repository root. Review the proposed service named `traveldex`.
6. The Blueprint creates a Node web service on the Free plan and sets the build command, start command, and `/health` health-check path.
7. Review the required environment variables. Render generates `SESSION_SECRET` automatically; supply the remaining values below.
8. Select **Deploy Blueprint**.

Render Blueprint instructions: https://render.com/docs/infrastructure-as-code

## 5. Enter the environment variables in Render

In the Render Blueprint setup prompt, or later under your service's **Environment** page, set:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_URL` | The MongoDB Atlas connection URI from Step 2 |
| `SESSION_SECRET` | Let Render generate this value; it must be at least 32 characters |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Product Environment cloud name |
| `CLOUDINARY_KEY` | Cloudinary API key |
| `CLOUDINARY_SECRET` | Cloudinary API secret |
| `MAPBOX_TOKEN` | Mapbox public `pk.` token |

Never add real credentials to `render.yaml`, `.env.example`, or GitHub. Render's environment-variable guide: https://render.com/docs/configure-environment-variables

## 6. Wait for the first deploy and verify database access

1. Open the Render service's Events/Deploys page and inspect the build and runtime logs.
2. The build runs `npm install`, syntax checks, tests, and a production dependency audit. The server then connects to MongoDB before it begins listening.
3. If startup logs show a MongoDB network error, open the service's **Connect → Outbound** panel in Render, copy its outbound IP ranges, add those ranges to Atlas Network Access, and redeploy/restart the service.
4. When the deploy succeeds, open `https://YOUR-SERVICE.onrender.com/health`. The expected response is `{"status":"ok"}`.
5. Open the main `https://YOUR-SERVICE.onrender.com` URL and test registration, login/logout, campground listing, location creation/editing/deletion, photographs, maps, and reviews.

## 7. After the first deployment

1. Replace any temporary Atlas `0.0.0.0/0` access-list rule with the outbound CIDR ranges shown in Render.
2. Verify the Mapbox map and location lookup. If either fails, inspect Mapbox token scopes and usage statistics before changing code.
3. Keep all service secrets in Render environment variables, not in GitHub.
4. Make periodic MongoDB backups.
5. Render Free web services spin down after 15 minutes without inbound traffic; the first request after idle may take about a minute. The filesystem is ephemeral, so images must remain in Cloudinary, not on Render's local disk. Free Render instances are intended for hobby/testing workloads, not production-critical service.

## 8. Generate and commit a reproducible package lockfile (recommended)

The old lockfile was removed because it pinned the vulnerable 2021 dependency tree. The current Render build uses `npm install`, so the first deploy can proceed without a committed lockfile.

For reproducible builds, after the first deployment (or before it, if Node.js 24 is installed locally), clone the repository and run:

```sh
npm install
npm run check
npm test
npm audit --omit=dev --audit-level=moderate
```

Commit the newly generated `package-lock.json` to GitHub. After that file is committed, the Render build command can be changed from `npm install` to `npm ci`.

## Troubleshooting

- **Missing environment variable:** confirm all variables are present in the Render service and redeploy.
- **MongoServerSelectionError:** check the Atlas URI, database username/password, password URL encoding, and Atlas IP Access List.
- **Blank map or failed location search:** check the Mapbox public token and its read scopes. Remember that the current app uses one token in both browser and server requests.
- **Image upload failure:** verify all three Cloudinary values and the account's upload limits.
- **Login not persisting:** check MongoDB connectivity and `SESSION_SECRET`; sessions are stored in the same Atlas database in a `sessions` collection.
- **Build fails:** inspect the first failing line in Render logs. The build needs network access to npm and must run on Node.js 24.

## Sample data warning

The seed script deletes existing campground records. It refuses to run unless `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set and uses the first registered user as the sample author. Do not run it against a database with data you want to keep.
