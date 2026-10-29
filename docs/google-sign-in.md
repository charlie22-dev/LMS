# Google sign-in setup

The app retains its Laravel/Inertia monolith and uses the Firebase web SDK with Google's provider. Firebase identifies the user in a popup; Laravel verifies the Firebase ID token's RS256 signature against Google's rotating public certificates, checks issuer, audience, expiry, issue and authentication times, verified email, and Google provider, and then creates a normal Laravel session. Firebase client state is in-memory and cleared after the exchange.

1. Create a Firebase project and register a web app in the Firebase console.
2. Enable the Google provider in **Authentication → Sign-in method**. Configure the consent screen as required for the project.
3. Add your application hostname to **Authentication → Settings → Authorized domains**. For local development add `localhost` and `127.0.0.1` if both will be used. For production add your HTTPS domain.
4. Copy the web app's API key, auth domain, project ID and app ID into `.env` as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. Set `FIREBASE_PROJECT_ID` on the server to the same project ID. Do not put service account credentials in Vite variables.
5. Run `php artisan migrate`, `php artisan optimize:clear`, and `npm.cmd run build` (or start `npm.cmd run dev`). Restart any long-running application workers.
6. Open `/login` on an authorized domain and use **Continue with Google**. A first-time user is created as a student. A teacher/admin must be assigned that role by a trusted administrator.

The frontend API key and app configuration identify the Firebase project; they are not service account secrets. Restrict the key according to Firebase guidance. Use HTTPS in production and keep the session cookie secure.

