# ------------------- Étape 1 : Build React (Node) -------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ← ARG et ENV déclarés AVANT le build pour que Vite les voie
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .

RUN npm run build

# ------------------- Étape 2 : Serveur statique avec nginx -------------------
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]