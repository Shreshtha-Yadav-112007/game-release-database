Game Release Database — High-Level Design
1. System Overview
The Game Release Database is a full-stack web application that allows users to search for video games, view release information across platforms and regions, and generate an AI-based summary of a game's release history.
The system is composed of five major components:
- Frontend
- Backend/API
- PostgreSQL
- MongoDB
- External Gemini AI service
The frontend provides the user interface and handles user interaction. The backend exposes REST-style API endpoints, coordinates database access, and integrates with Gemini. PostgreSQL stores structured game and release data, while MongoDB stores supplementary game metadata and the generated AI summary. Gemini is called by the backend only when an AI release summary is requested.
The architecture separates presentation, application logic, relational data, document-oriented metadata, and external AI processing responsibilities.
2. System Architecture
The application follows a layered client-server architecture with two database systems and an external AI service:
┌────────────────────────────────────┐
│           Frontend Layer           │
│                                    │
│ React 19 + Vite                    │
│ React Router DOM                   │
│ Fetch API                          │
│ CSS                                │
└────────────────┬───────────────────┘
                 │ HTTP / JSON
                 ▼
┌────────────────────────────────────┐
│           Backend Layer            │
│                                    │
│ Node.js + Express 5                │
│ CORS + JSON middleware             │
│ PostgreSQL pg Pool                 │
│ MongoDB driver                     │
│ Gemini integration                 │
└──────────────┬───────────────┬─────┘
               │               │
             SQL/rows      Documents
               │               │
               ▼               ▼
     ┌────────────────┐ ┌─────────────────┐
     │   PostgreSQL   │ │    MongoDB      │
     │                │ │                 │
     │ games          │ │ game_metadata   │
     │ platforms      │ │ + aiSummary     │
     │ regions        │ │                 │
     │ releases       │ │                 │
     └────────────────┘ └─────────────────┘
               
                    HTTP/API call
                         │
                         ▼
                ┌──────────────────┐
                │   Gemini API     │
                │ structured JSON  │
                └──────────────────┘
The frontend never communicates directly with either database or with Gemini. All application-level access is routed through the backend.
PostgreSQL and MongoDB serve different purposes. PostgreSQL is used for normalized game and release data, while MongoDB stores supplementary metadata and the generated AI summary. The two stores are logically connected through the PostgreSQL game ID represented as gameId in MongoDB.
3. Technology Stack
Layer	Technology	Purpose
Frontend	React 19	User interface and component/state management
Frontend tooling	Vite	Development and production build tooling
Routing	React Router DOM	Client-side routing for game list and details pages
HTTP communication	Fetch API	Communication between frontend and backend
Styling	CSS	Application layout and responsive behavior
Backend runtime	Node.js	JavaScript runtime
Backend framework	Express 5	HTTP server and API routing
PostgreSQL client	pg	Connection pooling and SQL queries
PostgreSQL	PostgreSQL 16	Structured game and release storage
MongoDB client	mongodb	Document database access
MongoDB	MongoDB	Game metadata and AI summary storage
Environment configuration	dotenv	Loading environment variables
Cross-origin support	CORS	Restricting browser requests to the configured frontend origin
AI integration	Google Gemini API	Structured release-summary generation
Containerization	Docker / Docker Compose	Local multi-service deployment
Web server	Nginx	Serving the built React frontend in the production-style container


4. Frontend Layer
The frontend is implemented using React 19 with Vite.
The main application logic is located in:
frontend/src/App.jsx
The current application contains two main React components:
- App
- GameDetails
Frontend responsibilities
The frontend is responsible for:
- displaying the application interface
- accepting a game title search
- retrieving games from the backend
- displaying search results
- navigating to a selected game's route
- retrieving and displaying release information
- requesting an AI release summary
- displaying the structured AI summary
- managing loading states
- managing API error states
The current frontend does not provide a UI for the metadata CRUD endpoints. Those endpoints are available in the backend for MongoDB data management.
5. Frontend Routing
The application uses React Router DOM.
The implemented application routes are:
Route	Purpose
/games	Displays the game search interface and game list
/games/:id	Displays the selected game's releases and AI summary controls


The navigation flow is:
User clicks game
      ↓
navigate(`/games/${game.id}`)
      ↓
/games/:id
      ↓
GameDetails
      ↓
useParams()
      ↓
id
The URL therefore identifies the selected game and the GameDetails component uses the route parameter to retrieve the relevant release data.
6. Frontend State Management
The frontend uses React's useState and useEffect hooks for local state and side effects.
The App component manages:
- games
- search
- loading
- error
The GameDetails component manages:
- releases
- loading
- error
- aiSummary
- aiLoading
- aiError
Game search state flow
search
  ↓
useEffect([search])
  ↓
Fetch API
  ↓
setGames()
  ↓
React re-render
  ↓
Game list
Release state flow
URL id
  ↓
useParams()
  ↓
useEffect([id])
  ↓
Fetch API
  ↓
setReleases()
  ↓
React re-render
  ↓
Release list
AI summary state flow
Button click
  ↓
setAiLoading(true)
  ↓
POST /games/:id/ai-summary
  ↓
setAiSummary(data.summary)
  ↓
React re-render
  ↓
Structured AI summary displayed
7. Frontend API Communication
The frontend communicates with the backend using the browser's native fetch() API.
The backend URL is configured from:
VITE_API_URL
with http://localhost:3000 as the default.
Game retrieval
When there is no search term:
GET /games
When a search term is entered:
GET /games?search={searchTerm}
The search term is encoded with encodeURIComponent() before being included in the URL.
Release retrieval
When a game is selected:
GET /games/:id/releases
The game ID is read from the current route using useParams().
AI summary request
When the user selects the AI summary button:
POST /games/:id/ai-summary
The request does not require a request body. The game ID is supplied as a route parameter.
8. Frontend Loading and Error Handling
The frontend provides explicit loading and error state handling for games, releases, and AI summary generation.
Before requests, the relevant loading state is enabled. After receiving a response, the code checks response.ok. Failed responses are converted into JavaScript errors and handled in .catch() or try/catch blocks.
The request completion path uses .finally() to stop loading states.
The UI can therefore display states such as:
- Loading games...
- Loading releases...
- Generating AI Summary...
- Error: ...
AI summary generation uses async/await and has its own loading and error state so it does not overwrite the release-loading state.
9. Backend Layer
The backend is implemented using Node.js and Express 5.
The main backend file is:
backend/server.js
The backend is responsible for:
- receiving HTTP requests
- processing route parameters and query parameters
- validating integer game IDs where required
- executing PostgreSQL queries
- communicating with MongoDB
- generating AI summaries through Gemini
- returning JSON responses
- handling route/database/integration errors
- configuring CORS and JSON middleware
The backend is the central application layer between the frontend, both databases, and the external Gemini service.
10. Database Connections
PostgreSQL
PostgreSQL connectivity is handled in:
backend/db.js
The application uses pg.Pool, configured through environment variables:
- DB_USER
- DB_HOST
- DB_NAME
- DB_PASSWORD
- DB_PORT
The high-level access path is:
Express route
      ↓
pool.query()
      ↓
PostgreSQL
      ↓
result.rows
      ↓
Express response / application processing
MongoDB
MongoDB connectivity is handled in:
backend/mongo.js
The application connects using MONGODB_URI and uses the game_release_database database and game_metadata collection.
At startup, the backend connects to MongoDB before beginning to listen for requests. The MongoDB setup also applies the collection validator and creates a unique index on gameId.
The logical MongoDB relationship is:
PostgreSQL games.id  ────────  MongoDB game_metadata.gameId
The relationship is application-level rather than a database foreign key because the data is stored in two different database systems.
11. CORS Architecture
The backend enables CORS using the configured frontend URL:
FRONTEND_URL
If the variable is not provided, the application defaults to:
http://localhost:5173
The effective configuration is conceptually:
frontend origin
      ↓
FRONTEND_URL
      ↓
Express CORS middleware
      ↓
API requests accepted only from the configured origin
This is more restrictive than enabling unrestricted CORS and supports separate frontend/backend origins during development and deployment.
12. API Layer
The backend exposes the following endpoints:
Method	Endpoint	Purpose	Data store / service
GET	/	API status	Backend
GET	/games	Retrieve all games	PostgreSQL
GET	/games?search={term}	Search games by title	PostgreSQL
GET	/games/:id/releases	Retrieve releases for a game	PostgreSQL
POST	/games/:id/ai-summary	Generate and persist an AI release summary	MongoDB + PostgreSQL + Gemini
POST	/games/:id/metadata	Create game metadata	MongoDB
GET	/games/:id/metadata	Retrieve game metadata	MongoDB
PUT	/games/:id/metadata	Update game metadata	MongoDB
DELETE	/games/:id/metadata	Delete game metadata	MongoDB


The API is the boundary between the frontend and backend data/services. The frontend does not need to know the underlying PostgreSQL queries or MongoDB document operations.
13. Game Retrieval
The GET /games endpoint retrieves games from PostgreSQL.
Without a search term, the query returns all rows from games ordered by title ascending.
With a search term, PostgreSQL performs a case-insensitive partial title search using:
WHERE title ILIKE $1
with the parameter:
%search%
The query is parameterized, which helps prevent SQL injection.
The resulting rows are returned as JSON.
14. Release Retrieval
The GET /games/:id/releases endpoint retrieves release records for a game.
The backend:
1. reads the route parameter from req.params.id
2. executes a parameterized SQL query
3. joins releases with games, platforms, and regions
4. filters records by r.game_id
5. orders releases by r.release_date ASC
6. returns the result rows as JSON
The response contains the game title, release ID, platform, region, release format, release date, and notes.
The endpoint represents the relationship:
Game
  ↓
Releases
A game can therefore have multiple release records across platforms and regions.
15. Metadata Layer
Supplementary game metadata is stored in MongoDB in the game_metadata collection.
The metadata document includes required fields for:
- gameId
- title
- developer
- publisher
- genres
- aliases
- notes
- sources
- updatedAt
The sources field contains structured source objects with name, url, and note.
MongoDB validation is configured with a strict $jsonSchema validator and validationAction: "error".
A unique index on gameId prevents multiple metadata documents from representing the same game.
The metadata API validates that the route ID is an integer. The create endpoint also handles duplicate-key errors and returns HTTP 409 when metadata already exists for the game.
16. AI Release Summary Architecture
The AI release summary feature integrates MongoDB, PostgreSQL, and Gemini in a single backend workflow.
The endpoint is:
POST /games/:id/ai-summary
The high-level flow is:
Frontend
   ↓
POST /games/:id/ai-summary
   ↓
Validate integer game ID
   ↓
MongoDB: find metadata by gameId
   ↓
PostgreSQL: query release data with JOINs
   ↓
Build Gemini prompt from supplied release data
   ↓
Gemini API: generate structured JSON
   ↓
MongoDB: update aiSummary + updatedAt
   ↓
Backend returns { gameId, title, summary }
   ↓
Frontend displays structured summary
The route first verifies that game metadata exists in MongoDB. It then queries PostgreSQL for the game's release data. If no release rows are found, the endpoint returns a 404 response.
The release records passed to Gemini contain the platform, region, release format, release date, and notes. The prompt explicitly instructs Gemini to use only the supplied release data and not invent or assume additional facts.
The Gemini request uses structured output with application/json and a response schema containing six required fields:
- summary
- releaseCount
- platforms
- regions
- releaseFormats
- notablePatterns
The generated structured object is stored in MongoDB as aiSummary and the updatedAt field is refreshed.
The frontend displays all six fields from the returned structured summary.
17. Database Layer
The system uses a polyglot persistence approach:
PostgreSQL
PostgreSQL stores the normalized relational release model:
- games
- platforms
- regions
- releases
MongoDB
MongoDB stores document-oriented supplementary information:
- game_metadata
- aiSummary inside the metadata document when an AI summary has been generated
The two databases are complementary rather than redundant. PostgreSQL provides the structured release model and relationships, while MongoDB provides flexible metadata and persisted AI output.
18. Database Relationships
The PostgreSQL relationship model is:
              ┌─────────────┐
              │    games    │
              └──────┬──────┘
                     │
                   1 │
                     │
                   N │
              ┌──────▼──────┐
              │  releases   │
              └──┬──────┬───┘
                 │      │
              N  │      │  N
                 │      │
        ┌────────▼─┐  ┌─▼─────────┐
        │platforms │  │  regions  │
        └──────────┘  └───────────┘
Foreign keys in releases maintain these relationships:
- game_id → games.id
- platform_id → platforms.id
- region_id → regions.id
The MongoDB relationship is logical rather than relational:
PostgreSQL games.id
        │
        │ same game identifier
        ▼
MongoDB game_metadata.gameId
19. End-to-End Game Search Flow
When a user searches for a game:
1. User enters search term
          ↓
2. React updates search state
          ↓
3. useEffect detects search change
          ↓
4. Fetch API sends GET /games?search=...
          ↓
5. Express receives request
          ↓
6. Backend reads req.query.search
          ↓
7. PostgreSQL executes parameterized ILIKE query
          ↓
8. PostgreSQL returns matching games
          ↓
9. Express sends JSON response
          ↓
10. React checks response.ok
          ↓
11. setGames(data)
          ↓
12. React re-renders the game list
20. End-to-End Release Flow
When a user selects a game:
1. User clicks a game
          ↓
2. navigate(`/games/${game.id}`)
          ↓
3. React Router loads /games/:id
          ↓
4. GameDetails renders
          ↓
5. useParams() obtains id
          ↓
6. useEffect([id]) runs
          ↓
7. Fetch GET /games/:id/releases
          ↓
8. Express receives request
          ↓
9. Backend executes parameterized SQL + JOINs
          ↓
10. PostgreSQL returns releases
          ↓
11. Express returns JSON
          ↓
12. React checks response.ok
          ↓
13. setReleases(data)
          ↓
14. React re-renders
          ↓
15. releases.map() displays releases
21. Error Handling Architecture
Errors are handled at both backend and frontend levels.
Backend
Database, MongoDB, and Gemini operations are wrapped in try/catch blocks in the routes that use them.
Typical backend outcomes include:
- HTTP 400 for invalid game IDs on routes that validate the ID
- HTTP 404 when required game metadata or release data is not found
- HTTP 409 when duplicate metadata is created for an existing gameId
- HTTP 500 for database, integration, or other server-side failures
Errors are logged with console.error() and a user-facing JSON error message is returned.
Frontend
The frontend checks response.ok for API requests. Unsuccessful responses are converted into errors and shown through component state.
The AI feature maintains separate aiLoading and aiError state so AI failures do not replace the release data already displayed on the page.
22. Security Architecture
The current system implements several basic security controls.
Backend/database separation
The frontend does not directly connect to PostgreSQL or MongoDB. Database credentials remain on the backend.
Parameterized SQL queries
Search terms and database identifiers used in SQL queries are supplied as parameters rather than concatenated directly into SQL statements. This helps prevent SQL injection.
Restricted CORS
CORS is limited to the configured FRONTEND_URL, defaulting to http://localhost:5173.
Environment variables
Database credentials, MongoDB URI, Gemini API key, frontend URL, and server port are configured through environment variables rather than embedded in application source code.
MongoDB schema validation
The game_metadata collection uses a strict JSON Schema validator, reducing the risk of storing malformed metadata documents.
Input validation
The metadata and AI-summary routes validate that the supplied game ID is an integer before continuing.
23. Responsive Design
The frontend uses CSS media queries to adapt the layout for smaller screens.
The main responsive breakpoint currently used is:
@media (max-width: 1024px)
At this breakpoint, the application reduces spacing and graphical dimensions and changes selected layouts from rows to columns. Links are also allowed to wrap where required.
This allows the existing web interface to adapt to smaller viewports without requiring a separate mobile application.
24. Containerized Deployment Architecture
The repository includes a Docker Compose configuration with three containers:
┌──────────────────────────────┐
│ Frontend container           │
│ Vite build → Nginx           │
│ Host: 5173 → Container: 80   │
└───────────────┬──────────────┘
                │ HTTP
                ▼
┌──────────────────────────────┐
│ Backend container            │
│ Node.js + Express            │
│ Host: 3000 → Container: 3000 │
└───────────────┬──────────────┘
                │
        ┌───────┴────────┐
        │                │
      SQL            MongoDB URI
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ PostgreSQL   │  │ External MongoDB  │
│ container    │  │ configured via    │
│ port 5432    │  │ MONGODB_URI       │
└──────────────┘  └──────────────────┘
The Docker Compose file explicitly defines PostgreSQL, backend, and frontend services.
The PostgreSQL container uses the schema.sql and seed.sql files as initialization scripts and persists database data through the postgres_data named volume.
The backend container runs the Node.js API on port 3000. The frontend uses a multi-stage Docker build: Vite creates the production bundle and Nginx serves the resulting static files.
The Compose configuration uses depends_on to establish service startup ordering between PostgreSQL and the backend, and between the backend and frontend. This establishes startup order but does not itself provide a database health check.
25. Development Environment
The application can be developed without containers using separate frontend and backend processes:
React/Vite Development Server
        │
        │ HTTP / JSON
        ▼
Node.js / Express Server
        │
        ├──────────── SQL ───────────► PostgreSQL
        │
        └──────────── Documents ─────► MongoDB
                         
                         Gemini API
The default local frontend and backend addresses are:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
PostgreSQL is accessed by the backend using the configured database environment variables. MongoDB and Gemini are also accessed from the backend using their respective environment variables.
26. Git Development Workflow
The project is developed using feature branches and pull requests.
The general workflow is:
main
  ↓
feature branch
  ↓
implementation
  ↓
commit
  ↓
Pull Request
  ↓
review / diff
  ↓
merge into main
This workflow provides isolated feature development and a traceable project history.
27. Scalability and Current Limitations
The current architecture is intentionally simple but includes clear extension points.
Potential future scalability improvements include:
- indexes for frequently searched fields
- pagination for large result sets
- improved search and filtering
- caching where appropriate
- more granular frontend components
- additional backend service/repository layers
- asynchronous/background AI processing for larger workloads
- production-grade observability and monitoring
- larger-scale database optimization
Current application limitations include:
- no user accounts
- no authentication or authorization
- no user collections
- no advanced filtering UI
- no price tracking
- no community contributions
- no automated data ingestion
- no dedicated mobile application
- the current frontend focuses on title search, release viewing, and AI summary generation
- metadata CRUD is exposed through backend API endpoints but is not represented as a frontend management interface
- the Docker Compose setup is suitable for local/containerized deployment; production hosting configuration is not defined in the repository
The GET /games/:id/releases route currently passes the raw route parameter to PostgreSQL rather than applying the integer validation used by the metadata and AI-summary routes.
28. Architecture Summary
The current Game Release Database uses a React frontend, an Express backend, PostgreSQL for structured release data, MongoDB for supplementary metadata and persisted AI summaries, and Gemini for on-demand release analysis.
┌────────────────────────────────────────┐
│                FRONTEND                │
│                                        │
│ React 19                               │
│ Vite                                   │
│ React Router DOM                       │
│ Fetch API                              │
│ CSS                                    │
│                                        │
│ App                                    │
│ GameDetails                            │
└──────────────────┬─────────────────────┘
                   │ HTTP / JSON
                   ▼
┌────────────────────────────────────────┐
│                BACKEND                 │
│                                        │
│ Node.js                                │
│ Express 5                              │
│ CORS + JSON middleware                 │
│ PostgreSQL pg Pool                     │
│ MongoDB driver                          │
│ Gemini integration                     │
│                                        │
│ /                                     │
│ /games                                 │
│ /games/:id/releases                    │
│ /games/:id/ai-summary                  │
│ /games/:id/metadata (CRUD)             │
└───────────────┬─────────────┬──────────┘
                │             │
              SQL        Documents
                │             │
                ▼             ▼
        ┌──────────────┐  ┌────────────────┐
        │ PostgreSQL   │  │ MongoDB        │
        │              │  │                │
        │ games        │  │ game_metadata  │
        │ platforms    │  │ + aiSummary    │
        │ regions      │  │                │
        │ releases     │  │                │
        └──────────────┘  └────────────────┘
                
                      API call
                         │
                         ▼
                ┌──────────────────┐
                │ Gemini API       │
                │ structured JSON  │
                └──────────────────┘
The main application flows are:
User
  → React
  → Fetch
  → Express
  → PostgreSQL / MongoDB / Gemini
  → Express
  → JSON
  → React
  → UI
This architecture matches the current implementation and provides a clean foundation for extending search, metadata management, AI capabilities, and future user-facing features.