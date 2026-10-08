Game Release Database

A full-stack web application for finding and organizing video game release information across platforms and regions. The system combines PostgreSQL for structured release data, MongoDB for flexible game metadata, and the Google Gemini API for structured AI-generated release summaries.

Features:

Game search and browsing:

- View all games from the PostgreSQL database.
- Search games by title using case-insensitive partial matching.
- Results are returned in alphabetical order.
- Select a game to view its release information.

Release information:

- View releases associated with a game.
- Display platform, region, release format, release date, and notes.
- Release data is assembled through PostgreSQL joins between games, platforms, regions, and releases.
- Releases are ordered by release date.

Game metadata:

- Store additional game metadata in MongoDB, including:
  - Developer
  - Publisher
  - Genres
  - Aliases
  - Notes
  - Sources
- Create, retrieve, update, and delete metadata through the backend API.
- MongoDB uses schema validation and a unique index on gameId.

AI release summaries:

- Generate a structured release summary using the Google Gemini API.
- The backend supplies release data to Gemini and instructs it to use only the provided information.
- The generated summary contains:
  - Summary
  - Release count
  - Platforms
  - Regions
  - Release formats
  - Notable patterns
- The generated summary is stored back in MongoDB with an updatedAt timestamp.

Architecture:

React + Vite frontend
        |
        | REST API / JSON
        v
Express + Node.js backend
        |
        +--------------------+---------------------+
        |                    |                     |
        v                    v                     v
   PostgreSQL            MongoDB            Google Gemini API
   Release data          Metadata            AI summaries
        |
        +-- games
        +-- platforms
        +-- regions
        +-- releases

The frontend communicates only with the Express backend. PostgreSQL and MongoDB serve different data responsibilities: PostgreSQL stores normalized relational release data, while MongoDB stores flexible game metadata and the generated AI summary.

Technology Stack:

Area	Technologies
Frontend	React 19, React Router, Vite, HTML5, CSS3, JavaScript
Backend	Node.js 20, Express 5
Relational database	PostgreSQL 16
Document database	MongoDB
AI	Google Gemini API (@google/genai)
API style	REST APIs, JSON
Development tools	Git, GitHub, npm, Postman
Containerization	Docker, Docker Compose
Web server	Nginx
Deployment	Render-compatible services / container deployment

Project Structure:

game-release-database-main/
├── backend/
│   ├── db.js
│   ├── gemini.js
│   ├── mongo.js
│   ├── server.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── HLD.md
│   ├── LLD.md
│   ├── MVP.md
│   ├── PRD.md
│   ├── database-design.md
│   ├── problem-statement.md
│   └── research.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md

API Endpoints:

Method	Endpoint	Purpose
GET	/	API health/root response
GET	/games	List all games
GET	/games?search=<title>	Search games by title
GET	/games/:id/releases	Get releases for a game
POST	/games/:id/ai-summary	Generate and store an AI release summary
POST	/games/:id/metadata	Create MongoDB game metadata
GET	/games/:id/metadata	Get game metadata
PUT	/games/:id/metadata	Update game metadata
DELETE	/games/:id/metadata	Delete game metadata


Data Model:

PostgreSQL
The relational database contains four tables:
- games — core game information.
- platforms — platform reference data.
- regions — region reference data.
- releases — release records connecting a game, platform, and region.
The releases table uses foreign keys to connect to games, platforms, and regions.

MongoDB
MongoDB stores documents in the game_metadata collection. Each document is identified by the PostgreSQL game's numeric ID through gameId.

A metadata document contains the required fields gameId, title, developer, publisher, genres, aliases, notes, sources, and updatedAt. It may also contain the structured aiSummary object produced by Gemini.

AI Summary Flow:

Client
  |
  | POST /games/:id/ai-summary
  v
Express backend
  |
  +--> Validate game ID
  |
  +--> Read game metadata from MongoDB
  |
  +--> Read release data from PostgreSQL
  |
  +--> Build prompt from supplied release data
  |
  +--> Generate structured summary with Gemini
  |
  +--> Update MongoDB with aiSummary + updatedAt
  |
  +--> Return { gameId, title, summary }
  v
Client

The Gemini prompt explicitly instructs the model not to invent or assume release facts and requests JSON matching the backend response schema.

Getting Started:-

Prerequisites:

For local development, install:
- Node.js 20+
- npm
- PostgreSQL 16+ (or use the PostgreSQL Docker service)
- MongoDB
- A Google Gemini API key for the AI summary feature
- Git

1. Clone the repository:

git clone <repository-url>
cd game-release-database-main

2. Configure the backend:

Create backend/.env from backend/.env.example and provide your actual values:
DB_USER=postgres
DB_HOST=localhost
DB_NAME=game_release_database
DB_PASSWORD=your_password
DB_PORT=5432

MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
PORT=3000
FRONTEND_URL and PORT are optional because the backend provides local defaults, but they should be set for deployed environments.

3. Set up PostgreSQL:

Create the database and run the schema and seed files:
psql -U postgres -d game_release_database -f database/schema.sql
psql -U postgres -d game_release_database -f database/seed.sql
The seed data includes sample games, platforms, regions, and release records.

4. Install backend dependencies:

cd backend
npm install
npm start
The backend listens on port 3000 by default.

5. Install frontend dependencies:

In another terminal:
cd frontend
npm install
npm run dev
The Vite development server normally runs at http://localhost:5173.

6. Configure the frontend API URL:

The frontend defaults to:
VITE_API_URL=http://localhost:3000
This can be overridden using frontend/.env.

Running with Docker Compose
The repository includes Docker Compose configuration for PostgreSQL, the backend, and the frontend:
docker compose up --build
The services are exposed as:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

The PostgreSQL container automatically runs database/schema.sql and database/seed.sql when its data volume is initialized.

MongoDB note: the current docker-compose.yml does not create a MongoDB container. The backend therefore needs MONGODB_URI to point to an accessible MongoDB deployment. For local Docker usage, make sure the configured MongoDB connection string is reachable from the backend container.

Development Notes
- PostgreSQL queries use parameterized values for the title search and release/game lookups.
- The backend uses async/await with try/catch for database and AI operations.
- CORS is restricted to FRONTEND_URL, defaulting to http://localhost:5173.
- MongoDB is connected before the Express server begins listening.
- The frontend uses React state and effects for fetching, loading states, errors, and AI-summary state.

Current Scope:-

Implemented:

- Game listing and title search
- Game release lookup
- MongoDB metadata CRUD
- Gemini-powered structured release summaries
- PostgreSQL and MongoDB integration
- Dockerized frontend/backend/PostgreSQL setup

Not currently implemented:

- User authentication and authorization
- Release record CRUD
- Advanced filtering by platform, region, or release format
- Pagination
- Game creation/deletion through the API
- Automated test suite
- MongoDB container in the current Docker Compose file

Documentation:

Detailed project documentation is available in the docs/ directory:

- PRD.md — product requirements
- MVP.md — minimum viable product scope
- HLD.md — high-level architecture
- LLD.md — low-level implementation design
- database-design.md — PostgreSQL and MongoDB design
- problem-statement.md — project problem statement
- research.md — supporting research