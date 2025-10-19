# Simple-Sculpt

Minimal fitness tracker MVP built with React, Vite, and Firebase for calories and protein tracking.

## Setup

```bash
npm create vite@latest simple-sculpt -- --template react-ts
cd simple-sculpt
npm install
```

1. Replace the placeholder values in `src/firebase.ts` with your Firebase project configuration.
2. Enable Email/Password authentication in Firebase and add your deployed domain to the authorized domains list.
3. Deploy to Vercel (or your preferred hosting) once `npm run build` succeeds.

## Development

```bash
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```
