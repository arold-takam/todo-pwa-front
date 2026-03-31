# ToDo PWA — TeckIt

> Application de gestion de tâches **offline-first** — React 19 + Spring Boot 3 (Modulith) + PostgreSQL + Docker + CI/CD GitHub Actions + Monitoring (Prometheus / Grafana / Loki / Tempo)

---

## 🗂️ Structure du dépôt

```
todo_pwa/
├── toDoApp/                          # Back-end Spring Boot (multi-module Maven)
│   ├── pom.xml                       # POM parent
│   ├── Dockerfile
│   ├── application/                  # Module de démarrage (config, security, bootstrap)
│   ├── common/                       # Exceptions, ApiResponse, logging partagés
│   ├── module-user/                  # Domaine utilisateur (CRUD + events)
│   └── module-task/                  # Domaine tâche (CRUD + listener events)
├── front/                            # Front-end React + Vite + PWA
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── features/task/            # Architecture hexagonale (domain / infra / app / ui)
│   │   ├── features/user/            # Architecture hexagonale utilisateur
│   │   ├── context/                  # Contextes React globaux
│   │   └── utils/                   # Helpers (offline sync)
│   └── vite.config.js
├── monitoring/                       # Configs Prometheus / Grafana / Loki / Promtail / Tempo
├── docker-compose.yml                # Stack applicatif (back + front + postgres)
├── docker-compose.monitoring.yml     # Stack monitoring
├── docker-compose.sonar.yml          # SonarQube
└── .github/workflows/               # CI/CD GitHub Actions
    ├── ci-back.yml
    └── ci-front.yml
```

---

## ⚙️ Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Docker + Docker Compose | 24+ |
| Java (pour dev local back) | 21 |
| Node.js (pour dev local front) | 20 |
| Maven (pour dev local back) | 3.9 |

---

## 🚀 Démarrage rapide

### Dev local — Back seul (H2 en mémoire)

```bash
cd toDoApp
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# API disponible sur http://localhost:8080/api/v1
# Swagger : http://localhost:8080/api/v1/swagger-ui.html
# H2 console : http://localhost:8080/api/v1/h2-console
```

### Dev local — Front seul

```bash
cd front
npm install
npm run dev
# App disponible sur http://localhost:5173
# Pointe vers http://localhost:8080/api/v1 (via .env.development)
```

### Dev complet — Docker Compose (recommandé)

```bash
# Build et démarrage des 3 services (postgres + back + front)
docker compose up --build

# URLs :
# Front PWA   → http://localhost:3000
# Back API    → http://localhost:8080/api/v1
# Swagger     → http://localhost:8080/api/v1/swagger-ui.html
# Postgres    → localhost:5433 (user: postgres / mdp: postgres / db: todoApp_db)

# Stopper
docker compose down

# Reset complet (supprime les données)
docker compose down -v
```

### Monitoring local

```bash
docker compose -f docker-compose.monitoring.yml up -d

# Grafana    → http://localhost:3001  (admin / admin)
# Prometheus → http://localhost:9090
# Loki       → http://localhost:3100
# Tempo      → http://localhost:3200

# Dashboards recommandés à importer dans Grafana :
# JVM Spring Boot  → ID: 4701
# Spring Boot 3.x  → ID: 19004
# Loki Logs        → ID: 13639
```

### SonarQube local

```bash
docker compose -f docker-compose.sonar.yml up -d
# → http://localhost:9000 (admin / admin → changer au premier login)

# Analyser le back
cd toDoApp
mvn sonar:sonar -Dsonar.token=TON_TOKEN

# Analyser le front
cd front
npx sonar-scanner -Dsonar.token=TON_TOKEN -Dsonar.host.url=http://localhost:9000
```

---

## 🔑 Variables d'environnement

### Back — profil `preprod` (Docker local)

| Variable | Valeur par défaut | Description |
|----------|------------------|-------------|
| `SPRING_PROFILES_ACTIVE` | `preprod` | Profil Spring actif |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/todoApp_db` | URL de la DB |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | User DB |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Mot de passe DB |

### Back — profil `prod` (Render)

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Mettre `prod` |
| `SPRING_DATASOURCE_URL` | URL fournie par Render PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | User fourni par Render |
| `SPRING_DATASOURCE_PASSWORD` | Mot de passe fourni par Render |
| `PORT` | Injecté automatiquement par Render |

### Front

| Variable | Dev | Prod |
|----------|-----|------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | `/api/v1` (proxy nginx) ou URL Render |

---

## 🔐 Secrets GitHub Actions à configurer

Aller dans : **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Ton username Docker Hub |
| `DOCKERHUB_TOKEN` | Token Docker Hub (Account → Security) |
| `SONAR_HOST_URL` | URL SonarQube (ex: `https://sonarcloud.io`) |
| `SONAR_TOKEN_BACK` | Token projet back généré dans SonarQube |
| `SONAR_TOKEN_FRONT` | Token projet front généré dans SonarQube |
| `RENDER_API_KEY` | Render → Account Settings → API Keys |
| `RENDER_SERVICE_ID_BACK` | ID du service back sur Render (commence par `srv-`) |
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site settings → Site ID |
| `VITE_API_BASE_URL_PROD` | URL complète du back Render, ex: `https://todo-back.onrender.com/api/v1` |

---

## 🏗️ Architecture

### Back — Spring Boot Modulith

```
application (module de démarrage)
    ↓ dépend de
module-user ←──events──→ module-task
    ↓                         ↓
common (partagé)          common (partagé)
    ↓                         ↓
          PostgreSQL
```

- Les modules communiquent via **Spring ApplicationEvents** (UserCreatedEvent, UserDeletedEvent)
- Pas d'appels directs entre modules sauf via `shared/` (UserSharedService)
- Profils : `dev` (H2 en mémoire) / `preprod` (PostgreSQL Docker) / `prod` (PostgreSQL Render)

### Front — Architecture hexagonale

```
src/features/task/
├── domain/          # Entités métier pures (Task.js)
├── infrastructure/  # Appels API (TaskApiAdapter, apiClient)
├── application/     # Logique applicative (useTasks hook)
└── ui/              # Composants React (Home, FormAdd, FormUpdate)

src/features/user/
├── domain/
├── infrastructure/
├── application/
└── ui/              # (UserList, UserForm)
```

### PWA Offline-first

```
Action utilisateur
    ↓
Mise à jour optimiste (état local + Dexie/IndexedDB)
    ↓
Tentative API → succès : marque synced=true
                 échec  : reste synced=false (pendingAction marqué)
    ↓
Retour online → CustomEvent 'app:sync-requested'
    ↓
TaskContext rejoue toutes les tâches pending
```

---

## 📡 API Endpoints

### Users — `/api/v1/user`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/save` | Créer un utilisateur |
| `GET` | `/find/all` | Lister tous les utilisateurs |
| `GET` | `/find/byId/{id}` | Trouver par ID |
| `GET` | `/find/byUsername?username=X` | Trouver par username |
| `PUT` | `/update/{id}` | Modifier |
| `DELETE` | `/delete/{id}` | Supprimer (cascade sur les tâches) |

### Tasks — `/api/v1/task`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/save` | Créer une tâche |
| `GET` | `/find/all` | Lister toutes les tâches |
| `GET` | `/find/all/{userId}` | Lister par utilisateur |
| `GET` | `/find/byId/{id}` | Trouver par ID |
| `PUT` | `/update/{id}` | Modifier |
| `PATCH` | `/validate/{id}` | Marquer comme faite |
| `DELETE` | `/delete/{id}` | Supprimer |

---

## 🧪 Plan de test

### Dev local

```bash
# 1. Tests unitaires back
cd toDoApp && mvn test

# 2. Test modulith structure
cd toDoApp && mvn test -Dtest=ModulithStructureTests

# 3. Test API via Swagger
open http://localhost:8080/api/v1/swagger-ui.html

# 4. Test PWA offline
# → Ouvrir http://localhost:3000
# → DevTools → Network → Offline
# → Créer/modifier des tâches → vérifier qu'elles apparaissent
# → Network → Online → vérifier la sync automatique

# 5. Test installabilité PWA
# → Chrome → barre d'adresse → icône install
# → Ouvrir l'app installée, couper le réseau, tester
```

### Prod (Render + Netlify)

```bash
# Vérifier le back en vie
curl https://TON-BACK.onrender.com/api/v1/actuator/health

# Vérifier les métriques
curl https://TON-BACK.onrender.com/api/v1/actuator/prometheus

# Tester un endpoint
curl https://TON-BACK.onrender.com/api/v1/user/find/all
```

---

## 📈 Axes d'amélioration pour applications scalables futures

### Sécurité (priorité 1)
- Implémenter **JWT** (Spring Security + `spring-boot-starter-oauth2-resource-server`)
- Remplacer `USER_ID = 1` hardcodé par l'ID extrait du token JWT
- Encoder les mots de passe avec **BCrypt** (`PasswordEncoder`)
- Passer les secrets DB dans **HashiCorp Vault** ou **AWS Secrets Manager**

### Architecture back
- Migrer vers **Spring Modulith avec persistence JDBC** (remplacer les appels directs entre modules)
- Ajouter une couche **validation Bean Validation** (`@Valid` sur tous les DTOs)
- Implémenter **pagination** sur tous les endpoints `findAll`
- Ajouter des **tests d'intégration** avec `@SpringBootTest` + Testcontainers

### Architecture front
- Remplacer `USER_ID = 1` par un **UserContext** réel alimenté par le JWT
- Ajouter **React Query** (TanStack Query) pour la gestion du cache serveur
- Implémenter un **système de notifications** (toast) pour remplacer les `alert()`
- Ajouter des **tests** (Vitest + React Testing Library)

### DevOps & scalabilité
- Ajouter **Kubernetes** (Helm charts) pour déploiement multi-instances
- Implémenter **Blue/Green deployment** sur Render
- Ajouter **alerting Grafana** (AlertManager) sur les métriques critiques
- Mettre en place **cache distribué Redis** pour les requêtes fréquentes
- Ajouter **rate limiting** (Bucket4j ou Spring Cloud Gateway)
- Implémenter **health checks** applicatifs personnalisés dans Actuator

---

## 🐛 Bugs connus et limitations actuelles

| Item | Statut | Solution prévue |
|------|--------|----------------|
| `USER_ID = 1` hardcodé côté front | ⚠️ | Authentification JWT |
| Delete offline non rejoué à la sync | ⚠️ | Table `pending_deletes` dans Dexie |
| Pas de tests automatisés front | ⚠️ | Vitest + RTL |
| Swagger désactivé en prod | ℹ️ | Normal, intentionnel |
| `ddl-auto: update` en prod | ⚠️ | Migrer vers Flyway ou Liquibase |

---

## 🤝 Contribuer

```bash
# Cloner
git clone https://github.com/TON_USERNAME/todo_pwa.git

# Créer une branche
git checkout -b feat/ma-feature

# Développer, committer
git commit -m "feat: description claire"

# Push et PR → la CI se déclenche automatiquement
git push origin feat/ma-feature
```

---

## 📄 Licence

MIT — libre d'utilisation, modification et distribution.
