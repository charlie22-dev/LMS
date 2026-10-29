# Google sign-in setup

The app retains its Laravel/Inertia monolith and uses the Firebase web SDK with Google's provider. Firebase identifies the user in a popup; Laravel verifies the Firebase ID token's RS256 signature against Google's rotating public certificates, checks issuer, audience, expiry, issue and authentication times, verified email, and Google provider, and then creates a normal Laravel session. Firebase client state is in-memory and cleared after the exchange.

1. Create a Firebase project and register a web app in the Firebase console.
2. Enable the Google provider in **Authentication → Sign-in method**. Configure the consent screen as required for the project.
