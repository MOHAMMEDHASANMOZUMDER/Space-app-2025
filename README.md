# Mars Recycler

Interactive Mars recycling concept with a Three.js frontend and a Node/Express backend that proxies NASA APIs with caching and fallbacks.

## Features
- Three.js rotating Mars scene and UI sections
- Backend API with endpoints:
  - `GET /api/waste-types`
  - `POST /api/process` (simulate energy and byproducts)
  - `GET /api/mars-weather` (cached + fallback snapshot)
  - `GET /api/mars-photos` (cached + local images fallback)
- Static serving of the entire project via backend

## Quick start
1. Install backend deps:
   - Windows (cmd):
     ```
     cd mars-backend
     npm install
     ```
2. Run backend (optionally with your NASA API key):
   ```
   set NASA_API_KEY=YOUR_KEY && node server.js
   ```
   Or without a key (falls back to DEMO_KEY):
   ```
   node server.js
   ```
3. Open the app:
   - http://localhost:5001/i3.html

The frontend auto-detects same-origin and calls the API at the correct base URL.

## Notes
- If NASA endpoints are slow/unavailable, backend returns cached/static data to keep the UI responsive.
- Local images under `textures/` are used as photo fallbacks.

## License
MIT
