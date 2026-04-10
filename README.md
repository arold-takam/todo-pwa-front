# ToDo PWA — TeckIt

> Application de gestion de tâches **offline-first** — React 19 + Spring Boot 3 (Modulith) + PostgreSQL  
> Stack DevOps : Docker · GitHub Actions · Netlify · Render · Prometheus · Grafana · Loki · Tempo

---

## 🗂️ Structure des dépôts

Ce projet est découpé en **2 dépôts GitHub séparés** :

| Dépôt | Contenu | CI/CD |
|-------|---------|-------|
| `todo-pwa-back` | Spring Boot multi-module Maven | GitHub Actions → Docker Hub → Render |
| `todo-pwa-front` | React + Vite + PWA | GitHub Actions → Netlify |

```
todo_pwa/                          ← racine locale (pas un repo Git)
├── toDoApp/                       ← clone de todo-pwa-back
│   ├── pom.xml                    # POM parent Maven
│   ├── Dockerfile
│   ├── application/               # Module boot (config, security, bootstrap)
│   ├── common/                    # Exceptions, ApiResponse partagés
│   ├── module-user/               # Domaine utilisateur
│   └── module-task/               # Domaine tâche
├── front/                         ← clone de todo-pwa-front
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── db.js                      # Dexie IndexedDB (offline store)
│   ├── vite.config.js
│   └── src/
│       ├── features/task/         # Architecture hexagonale tâches
│       ├── features/user/         # Architecture hexagonale users
│       ├── context/               # Contextes React globaux
│       └── utils/                 # initOfflineSync
├── monitoring/                    # Configs Prometheus/Grafana/Loki/Promtail/Tempo
├── docker-compose.yml
├── docker-compose.monitoring.yml
└── docker-compose.sonar.yml
```

---

## ⚙️ Prérequis

| Outil | Version |
|-------|---------|
| Docker + Docker Compose | 24+ |
| Java | 21 |
| Node.js | 20 |
| Maven | 3.9 |

---

## 🚀 Démarrage rapide

### Dev local — Back seul (H2 en mémoire)

```bash
cd toDoApp
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# API      → http://localhost:8080/api/v1
# Swagger  → http://localhost:8080/api/v1/swagger-ui.html
# H2       → http://localhost:8080/api/v1/h2-console
```

### Dev local — Front seul

```bash
cd front && npm install && npm run dev
# App → http://localhost:5173
```

### Stack complète Docker

```bash
docker compose up --build
# Front   → http://localhost:3000
# Back    → http://localhost:8080/api/v1
# Swagger → http://localhost:8080/api/v1/swagger-ui.html
# Postgres → localhost:5433

docker compose down        # Arrêt propre
docker compose down -v     # Arrêt + reset DB
```

### Monitoring local

```bash
docker compose -f docker-compose.monitoring.yml up -d
# Grafana    → http://localhost:3001  (admin/admin)
# Prometheus → http://localhost:9090
# Loki       → http://localhost:3100
# Tempo      → http://localhost:3200
# Dashboards à importer : 4701 (JVM), 19004 (Spring Boot 3), 13639 (Loki)
```

### SonarQube local

```bash
docker compose -f docker-compose.sonar.yml up -d
# → http://localhost:9000  (admin/admin)

cd toDoApp && mvn sonar:sonar -Dsonar.token=TON_TOKEN
cd front && npx sonar-scanner -Dsonar.token=TON_TOKEN -Dsonar.host.url=http://localhost:9000
```

---

## 🔑 Variables d'environnement

### Back — profil `preprod` (Docker local)

| Variable | Valeur par défaut |
|----------|------------------|
| `SPRING_PROFILES_ACTIVE` | `preprod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/todoApp_db` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` |

### Back — profil `prod` (Render)

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | URL Neon/Render PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | User DB prod |
| `SPRING_DATASOURCE_PASSWORD` | Mot de passe DB prod |
| `PORT` | Injecté automatiquement par Render |

> ⚠️ **Base de données Render Free** expire après 30 jours.  
> **Migrer vers Neon (gratuit, permanent)** :  
> 1. Créer un compte sur [neon.tech](https://neon.tech)  
> 2. Créer un projet → copier la connection string  
> 3. Render → Environment → `SPRING_DATASOURCE_URL` = `jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require`  
> 4. Redéployer

---

## 🔐 Secrets GitHub Actions

### Repo `todo-pwa-back`

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Username Docker Hub |
| `DOCKERHUB_TOKEN` | Token Docker Hub (Account → Security) |
| `SONAR_HOST_URL` | URL SonarQube — optionnel (skip si absent) |
| `SONAR_TOKEN_BACK` | Token projet back — optionnel |
| `RENDER_API_KEY` | Render → Account Settings → API Keys |
| `RENDER_SERVICE_ID_BACK` | ID service Render (commence par `srv-`) |

### Repo `todo-pwa-front`

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Username Docker Hub |
| `DOCKERHUB_TOKEN` | Token Docker Hub |
| `SONAR_HOST_URL` | URL SonarQube — optionnel |
| `SONAR_TOKEN_FRONT` | Token projet front — optionnel |
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site settings → Site ID |
| `VITE_API_BASE_URL_PROD` | ex: `https://todo-back.onrender.com/api/v1` |

---

## 🏗️ Architecture

### Back — Spring Boot Modulith

```
application (bootstrap, config, security)
    ↓ via interfaces publiques (shared/) uniquement
module-user ──── UserCreatedEvent / UserDeletedEvent ───→ module-task
    ↓                                                          ↓
              common (ApiResponse, EntityNotFoundException)
                              ↓
                         PostgreSQL
```

**Règle des frontières** : jamais d'accès aux packages `internal` depuis un autre module. Uniquement via `shared/`.

### Front — Architecture hexagonale

```
features/task/
├── domain/       Task.js
├── infrastructure/ TaskApiAdapter.js, apiClient.js
├── application/  useTasks.js (hook + sync offline)
└── ui/           Home, FormAdd, FormUpdate

features/user/
├── domain/       User.js
├── application/  useUsers.js
└── ui/           UserList.jsx
```

### PWA Offline-first

```
Action → Optimiste local (Dexie) → Tentative API
                                     ✅ synced=true
                                     ❌ synced=false, pendingAction marqué
Retour online → CustomEvent → TaskContext → syncPendingTasks() → rechargement UI
```

---

## 📡 API Endpoints

Base URL : `http://localhost:8080/api/v1`

### Users — `/user`
`POST /save` · `GET /find/all` · `GET /find/byId/{id}` · `GET /find/byUsername?username=X` · `PUT /update/{id}` · `DELETE /delete/{id}`

### Tasks — `/task`
`POST /save` · `GET /find/all` · `GET /find/all/{userId}` · `GET /find/byId/{id}` · `PUT /update/{id}` · `PATCH /validate/{id}` · `DELETE /delete/{id}`

---

## 🧪 Plan de test

### Local

```bash
docker compose up --build
curl http://localhost:8080/api/v1/actuator/health

# Test PWA offline (Chrome)
# 1. Ouvrir http://localhost:3000
# 2. F12 → Application → Service Workers → "Activated and running"
# 3. Network → Offline → créer/modifier des tâches
# 4. Network → Online → bannière verte + sync auto
```

### Prod

```bash
curl https://TON-BACK.onrender.com/api/v1/actuator/health
curl https://TON-BACK.onrender.com/api/v1/actuator/prometheus | grep http_server
```

---

## 📈 Améliorations pour scalabilité future

| Priorité | Item | Technologie |
|----------|------|-------------|
| 🔴 Critique | Auth JWT + BCrypt | spring-security-oauth2-resource-server |
| 🔴 Critique | Migrations DB | Flyway |
| 🟠 Important | Cache distribué | Redis |
| 🟠 Important | Tests front | Vitest + React Testing Library |
| 🟡 Moyen | Cache serveur front | TanStack Query |
| 🟡 Moyen | TypeScript | Migration progressive |
| 🟢 Nice | Bus de messages | Kafka |
| 🟢 Nice | Alerting | Grafana AlertManager |

---

## 🐛 Limitations connues

| Item | Solution prévue |
|------|----------------|
| `USER_ID = 1` hardcodé | JWT + UserContext |
| Mots de passe en clair | BCrypt |
| Delete offline non rejoué | Table `pending_deletes` Dexie |
| `ddl-auto: update` en prod | Flyway |
| DB Render expire 30j | Migrer vers Neon |

---

## 📄 Licence

MIT
