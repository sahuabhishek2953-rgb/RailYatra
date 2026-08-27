# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages packages
COPY apps apps

RUN npm ci

ARG VITE_API_URL=http://localhost:4000
RUN VITE_API_URL=${VITE_API_URL} npm run build

# Runtime stage - API
FROM node:22-alpine AS api-runtime
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages packages

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]

# Runtime stage - Web (Nginx + React SPA)
FROM nginx:alpine AS web-runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /app/apps/web/dist

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
