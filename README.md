# Nesora — fan app (Expo)

The phone app for fans: Home, Shorts, Subscriptions, You, the watch screen
with free preview → "Continue?" → storage charging, comments, likes,
subscriptions, notifications, report & block.

It talks to the Nesora website's API (`/api/v1`, see `nesora-mobile-api.md`).
Two things only happen on the website, opened already signed in:
**buying storage** and **Nesora Studio** (Create). There is no in-app purchase.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Email/password sign-in works in Expo Go.
Google sign-in and push notifications need a development build (below).

Point at a local server instead of nesora.org: create `.env` with
`EXPO_PUBLIC_API_URL=http://YOUR-PC-IP:3000` and run the website with
`npm run dev -- -H 0.0.0.0`.

## Builds (EAS)

```bash
npm install -g eas-cli
eas login
eas init                                   # links the project, adds its id to app.json (enables push)
eas build --profile development --platform android   # dev build: Google sign-in + push work
eas build --profile preview --platform android       # installable APK to share for testing
eas build --profile production --platform all        # store builds
eas submit --platform android|ios
```

Profiles live in `eas.json`; all of them use `https://nesora.org`.

## Before the store

- **Icon & splash:** replace `assets/images/icon.png`, `android-icon-*.png`,
  `splash-icon.png` and `assets/expo.icon` with Nesora artwork.
- **Google sign-in:** in Google Cloud, the OAuth client used by the website
  already works — the app signs in through nesora.org and returns to `nesora://`.
- **Push (Android):** upload an FCM key in Expo (`eas credentials`) so
  Android devices receive notifications. iOS push keys are set up by EAS.
- **Store listings need:** a privacy policy URL, a support email, content
  rating questionnaire, and a test account for reviewers (with some storage).
- **Account deletion:** You → Delete account (required by both stores). Google
  Play also asks for a web link — point it at a support page or email.
- **Buying storage:** the app never sells storage inside the app. Check the
  current Apple rules before submitting: in some regions iOS doesn't allow a
  button that links out to buy. If so, change the iOS label to plain text
  ("Top up at nesora.org") in `src/lib/handoff.ts` callers.

## Layout

```
src/
  app/            screens (Expo Router)
    (auth)/       login, signup, forgot-password
    (tabs)/       Home, Shorts, + (buy on web), Subscriptions, You
    watch/[id]    player + details + Up next
    channel/[handle], search, notifications, storage, blocked
  components/     UI pieces (feed, shorts, watch, comments, sheets, ui)
  hooks/          data hooks (TanStack Query)
  lib/            api client, auth client, hand-off, push, types, formatting
  theme/          colours (same as the website) and light/dark switch
```
