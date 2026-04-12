# ─────────────────────────────────────────
# Étape 1 : Build React avec Vite
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ARG injecté par docker-compose (local) ou la CI (prod)
# - Docker local     : /api/v1 (proxy nginx vers le back)
# - Netlify (prod)   : non utilisé (Netlify utilise .env.production directement)
# - Docker Hub (CI)  : /api/v1 (image générique, nginx proxifie)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Étape 2 : Serveur statique nginx
# ─────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]