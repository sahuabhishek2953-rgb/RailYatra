# 🚆 RailYatra — Next-Gen Indian Railways Live Tracking & Journey Intelligence

<div align="center">

![RailYatra Banner](https://img.shields.io/badge/RailYatra-Live%20Train%20Tracking-4F6EF7?style=for-the-badge&logo=train&logoColor=white)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Fastify](https://img.shields.io/badge/Fastify_5-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-000000?style=flat-square&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Render](https://img.shields.io/badge/Render-Backend_Live-46E3B7?style=flat-square&logo=render&logoColor=white)](https://railyatra-vcm6.onrender.com)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend_Live-black?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Docker Hub](https://img.shields.io/badge/Docker_Hub-abhisahu786-2496ED?style=flat-square&logo=docker&logoColor=white)](https://hub.docker.com/u/abhisahu786)

<p align="center">
  A high-performance, real-time train tracking platform for Indian Railways featuring interactive vector maps, dynamic terrain elevation charts, live speed computation, nearby geographical discoveries, and arrival geofencing.
</p>

[**Explore Live Demo**](https://railyatra-vcm6.onrender.com) · [**Report Bug**](https://github.com/sahuabhishek2953-rgb/RailYatra/issues) · [**Request Feature**](https://github.com/sahuabhishek2953-rgb/RailYatra/issues)

</div>

---

## 🌟 Key Features

### 1. 🚅 Live Train Intelligence & Real Speed
- **Universal Indian Railways Search**: Instant search by train number or name with debounced auto-complete and keyboard shortcuts (`⌘K` / `Ctrl+K`).
- **Dynamic Speed Calculation**: Real-time section speed in km/h derived dynamically from live segment telemetries.
- **Accurate Delays & Timings**: Real-time delay badges, scheduled vs actual arrival/departure timings, and platform indicators.

### 2. 🗺️ Advanced Map Experience
- **Vector Dark Map Theme**: Powered by MapLibre GL and MapTiler vector tiles.
- **Dual-Color Track Progress**: Glowing vibrant blue track (`#6B8BFF`) for completed sections and muted gray for remaining route.
- **Animated Pulsing Train Marker**: Live marker following the train's smoothed real-time coordinates.
- **Interactive Station Popups**: Click any station marker on the map to inspect arrival time, scheduled time, platform number, and delay.

### 3. 🏔️ Terrain Elevation Profile Chart
- **SRTM 30m Elevation Profiling**: Queried via OpenTopography & OpenTopoData APIs.
- **Interactive Recharts Area Graph**: Visualizes route altitude variations above sea level with a synchronized marker highlighting the train's current position.

### 4. 🌊 Live Terrain & Points of Interest
- **Geographical Discoveries**: Real-time discovery of prominent natural and heritage landmarks within 50 km of the train's position.
- **Rich Category Cards**: Horizontal scrollable cards with color-coded badges for **RIVERS**, **PEAKS**, **BRIDGES**, **LAKES**, **TUNNELS**, and **HERITAGE MONUMENTS**.
- **Context & Wikipedia Summaries**: Distance from train and instant links to Wikipedia articles.

### 5. 📊 Per-Station Delay History Visualizer
- Color-coded delay bar graph displaying station-by-station delays (Green for On-Time, Amber for small delays, Rose for major delays).

### 6. ⛅ Weather Companion
- Live OpenWeather integration for current station and upcoming destination (Temperature, Feels Like, Humidity, Wind Speed, Weather Conditions).

### 7. 📱 Progressive Web App (PWA) & Offline Ready
- Installable on Android, iOS, and Desktop as a standalone native-like application.
- Workbox Service Worker caching for instant loads and offline resilience.

### 8. 🔔 Geofencing Arrival Alerts & Journey Sharing
- Native browser desktop notifications and in-app toast alerts when train approaches destination (< 50 km).
- Instant public shareable journey URLs (`/share/:token`).

---

## 🏗️ Architecture & Monorepo Structure

```
RailYatra/
├── apps/
│   ├── web/                        # React 18 + Vite Frontend
│   │   ├── src/
│   │   │   ├── components/         # Shared UI & Layout (Header, AppShell, Cards)
│   │   │   ├── features/
│   │   │   │   ├── search/         # Train search bar, history, cards
│   │   │   │   ├── journey/        # Live status, timeline, elevation, POIs, alerts
│   │   │   │   ├── map/            # MapLibre GL dual-color map & custom markers
│   │   │   │   └── sharing/        # Journey link generation & view
│   │   │   ├── store/              # Zustand state store (favorites, recent searches)
│   │   │   └── lib/                # API client configuration
│   │   └── vercel.json             # Vercel SPA routing & backend API proxy
│   │
│   └── api/                        # Fastify + TypeScript Backend
│       ├── src/
│       │   ├── routes/             # trains, elevation, weather, nearby, share
│       │   ├── services/           # journey, elevation, geography, weather, cache
│       │   ├── providers/          # RailRadar, OpenWeather, OpenTopography
│       │   └── lib/                # Redis cache helper, mock fallbacks
│       └── tsconfig.json
│
└── packages/
    └── types/                      # Shared TypeScript models & domain types
        └── src/
            └── index.ts
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons |
| **Mapping** | MapLibre GL, MapTiler Vector Tiles, Turf.js |
| **Data Viz** | Recharts (Area Charts, Bar History) |
| **State & Query** | Zustand, TanStack React Query v5 |
| **PWA** | `vite-plugin-pwa`, Workbox |
| **Backend** | Node.js, Fastify 5, TypeScript, Zod |
| **Caching & DB** | Redis / In-Memory Cache |
| **External APIs** | RailRadar API, OpenWeather API, OpenTopography / SRTM 30m, Wikipedia GeoSearch |
| **Hosting** | Vercel (Frontend), Render (Backend) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/sahuabhishek2953-rgb/RailYatra.git
cd RailYatra
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env` file in `apps/api/`:
```env
PORT=4000
NODE_ENV=development
RAILRADAR_API_KEY=your_railradar_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
OPENTOPOGRAPHY_API_KEY=your_opentopography_api_key
REDIS_URL=redis://localhost:6379 # optional (in-memory fallback active)
```

### 4. Run Locally
Run both Backend and Frontend concurrently:
```bash
# Terminal 1: Start Fastify Backend (Port 4000)
npm run dev:api

# Terminal 2: Start Vite Frontend (Port 3000)
npm run dev:web
```

Visit **`http://localhost:3000`** in your browser.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/v1/trains/search?q={query}` | Search trains by number or name |
| `GET` | `/api/v1/trains/:id/journey` | Full live status, train details, timeline & speed |
| `GET` | `/api/v1/trains/:id/elevation` | Sampled terrain elevation points along route |
| `GET` | `/api/v1/weather?lat={lat}&lng={lng}` | Real-time weather for coordinate |
| `GET` | `/api/v1/nearby?lat={lat}&lng={lng}&radius={km}` | Rivers, peaks, bridges, and monuments nearby |
| `POST` | `/api/v1/share` | Generate public share token for journey |
| `GET` | `/api/v1/share/:token` | Retrieve shared journey snapshot |

---

## ☁️ Deployment

### Backend on Render
1. Create a **New Web Service** on [Render](https://render.com) connected to this repository.
2. Set **Build Command**: `npm install && npm run build:types && npm run build:api`
3. Set **Start Command**: `npm run start --workspace=apps/api`
4. Add Environment Variables (`RAILRADAR_API_KEY`, `OPENWEATHER_API_KEY`, etc.).

### Frontend on Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to `Vite`.
4. Deploy! All API requests will automatically proxy through `apps/web/vercel.json`.

### 🐳 Run with Docker (1-Command via Docker Hub)
Pull and run the pre-built images directly from Docker Hub:
```bash
# Pull official images from Docker Hub
docker pull abhisahu786/railyatra-api:latest
docker pull abhisahu786/railyatra-web:latest

# Run complete stack (Web + API + Redis)
docker compose up -d
```
Access Frontend at `http://localhost:5173` and API at `http://localhost:4000`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  Crafted with ❤️ for Indian Railways Travelers
</div>
