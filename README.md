# Hotel IQ

This workspace contains a simple dashboard UI and a minimal backend API.

## Structure

- `hotel-iq-dashboard.jsx` – main React component for the dashboard.
- `src/frontend` – frontend application powered by React and Parcel.
- `src/backend` – Node/Express server exposing a demo API and serving the built frontend.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   cd src/frontend && npm install
   ```

2. **Run in development**
   ```bash
   npm run dev
   ```
   This starts Parcel on the frontend and the Express server on port 5000.

3. **Build for production**
   ```bash
   npm run build:frontend
   npm run start:backend
   ```

4. **API example**
   - `GET /api/hello` returns `{ message: 'Hello from backend!' }`

Feel free to expand the server or frontend as needed.