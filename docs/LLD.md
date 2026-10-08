Game Release Database — Low-Level Design
1. Overview
The Game Release Database is a full-stack web application for searching games, viewing release information, managing supplementary game metadata, and generating structured AI summaries of release data.
The current implementation uses:
- Frontend: React 19 with Vite and React Router DOM
- Backend: Node.js with Express 5
- Relational database: PostgreSQL
- Document database: MongoDB
- AI service: Google Gemini API through @google/genai
- HTTP communication: Fetch API / REST-style JSON endpoints
- Deployment: Docker, Docker Compose, and Nginx for serving the frontend
The application separates the stable relational release data from flexible metadata and cached AI-summary data. PostgreSQL stores games and normalized release information, while MongoDB stores supplementary game metadata and the latest generated AI summary.
2. Technology Stack
Area	Technology
Frontend	React 19
Frontend tooling	Vite
Client-side routing	React Router DOM
Frontend HTTP	Fetch API
Frontend styling	CSS
Backend runtime	Node.js 20 container / CommonJS application
Backend framework	Express 5
PostgreSQL client	pg / Pool
MongoDB client	mongodb / MongoClient
AI SDK	@google/genai
AI model	gemini-3.5-flash-lite
Environment variables	dotenv
Cross-origin handling	cors
Relational database	PostgreSQL 16 Alpine container
Document database	MongoDB via MONGODB_URI
Containerization	Docker / Docker Compose
Frontend web server	Nginx
API style	REST-style HTTP + JSON


3. Project Structure
game-release-database/
│
├── backend/
│   ├── db.js
│   ├── gemini.js
│   ├── mongo.js
│   ├── server.js
│   ├── hoisting-demo.js
│   ├── event-loop-demo.js
│   ├── promises-callbacks-demo.js
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   └── .dockerignore
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .env.example
│
├── docs/
│   ├── PRD.md
│   ├── HLD.md
│   ├── LLD.md
│   ├── MVP.md
│   ├── database-design.md
│   ├── problem-statement.md
│   └── research.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
The supporting JavaScript demo files are educational artifacts and are not part of the production request flow.
4. Runtime Architecture
The application uses four local runtime/dependency components plus one external AI service:
- React frontend
- Express backend
- PostgreSQL
- MongoDB
- External Google Gemini API
The first four are the application's local/runtime components; Gemini is an external service called by the backend.
                         ┌──────────────────────┐
                         │      React App       │
                         │ React + Vite bundle  │
                         └──────────┬───────────┘
                                    │ HTTP / JSON
                                    ▼
                         ┌──────────────────────┐
                         │   Node + Express     │
                         │     REST routes      │
                         └───────┬───────┬──────┘
                                 │       │
                           SQL / pg    MongoDB
                                 │       │
                 ┌───────────────┘       └────────────────┐
                 ▼                                        ▼
        ┌─────────────────┐                      ┌─────────────────┐
        │   PostgreSQL    │                      │    MongoDB      │
        │ games/platforms │                      │ game_metadata   │
        │ regions/releases│                      │ + aiSummary     │
        └─────────────────┘                      └─────────────────┘
                                 │
                                 │ release data
                                 ▼
                         ┌──────────────────────┐
                         │   Google Gemini API  │
                         │ structured summary   │
                         └──────────────────────┘
The frontend never connects directly to either database or to Gemini. All database and AI access is performed by the Express backend.
5. Environment Configuration
The backend loads configuration using dotenv.
Backend variables
The backend uses:
- DB_USER
- DB_HOST
- DB_NAME
- DB_PASSWORD
- DB_PORT
- MONGODB_URI
- GEMINI_API_KEY
- FRONTEND_URL
- PORT
FRONTEND_URL defaults to http://localhost:5173 when not set.
PORT defaults to 3000 when not set.
Frontend variable
The frontend reads:
- VITE_API_URL
It defaults to http://localhost:3000 when not set.
Because Vite exposes VITE_* variables to client-side code, secrets such as database passwords and GEMINI_API_KEY remain backend-only.
Frontend Detailed Design
6. Frontend Entry Point
The frontend entry point is:
frontend/src/main.jsx
The application is mounted using:
<StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</StrictMode>
StrictMode
React Strict Mode is enabled for development checks.
BrowserRouter
BrowserRouter provides client-side routing so the selected game is represented by the URL rather than a separate global selectedGame state.
7. Frontend Components
The current App.jsx contains two application components:
1. App
2. GameDetails
There is no separate reusable component for the search form, game list, release list, or AI summary in the current implementation.
App
Responsibilities:
- game search input
- game list retrieval
- game-list loading state
- game-list error state
- navigation to a game detail route
- route definitions
GameDetails
Responsibilities:
- read the game ID from the URL
- retrieve releases
- display releases
- generate an AI release summary
- display AI loading/error state
- display the six structured AI-summary fields
8. API Base URL in the Frontend
App.jsx defines:
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
All backend requests are constructed from this base URL.
This allows the same frontend code to work with a configurable backend URL in development or deployment.
9. App Component State
The App component uses four pieces of state:
State	Purpose
games	Stores game records returned from GET /games
search	Stores the current search input
loading	Tracks the game-list request
error	Stores the game-list error message


The state declarations are:
const [games, setGames] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
The component also obtains navigation through:
const navigate = useNavigate();
10. Game Search Input
The search box is a controlled React input:
<input
  type="text"
  value={search}
  onChange={(event) => {
    setError(null);
    setLoading(true);
    setSearch(event.target.value);
  }}
/>
When the user types:
Input event
   ↓
setSearch()
   ↓
search state changes
   ↓
useEffect([search])
   ↓
GET /games or /games?search=...
The search parameter is URI-encoded with encodeURIComponent before being added to the URL.
11. Game Retrieval Effect
App uses a useEffect dependent on search.
Conceptually:
useEffect(() => {
  const url = search
    ? `${API_URL}/games?search=${encodeURIComponent(search)}`
    : `${API_URL}/games`;

  fetch(url)
    ...
}, [search]);
Behavior
Empty search:
GET /games
Non-empty search such as resident:
GET /games?search=resident
Every search change triggers a new request. The current implementation does not debounce input or cancel an earlier in-flight request.
12. Game Request Loading and Error Handling
The frontend checks response.ok after parsing the JSON response.
For a failed request:
throw new Error(data.error || "Failed to fetch games");
The catch handler stores the error message:
setError(error.message);
The finally block always clears the loading state:
setLoading(false);
The UI renders:
{loading && <p>Loading games...</p>}
{error && <p>Error: {error}</p>}
Before a new search, the previous error is cleared and loading is restarted.
13. Client-Side Routing
The application defines two routes:
Route	Component / purpose
/games	Game search and list
/games/:id	Specific game release and AI-summary page


Example:
/games/1
represents game ID 1.
Navigation is performed with:
navigate(`/games/${game.id}`);
The route changes without a full page reload.
14. GameDetails State
GameDetails uses six pieces of state:
State	Purpose
releases	Release records returned by the backend
loading	Tracks release retrieval
error	Stores release request errors
aiSummary	Stores the structured Gemini result
aiLoading	Tracks AI-summary generation
aiError	Stores AI request errors


This separates release-loading feedback from AI-generation feedback.
15. Release Retrieval Flow
GameDetails reads the route parameter using:
const { id } = useParams();
It then executes:
/games/:id
   ↓
useParams()
   ↓
id
   ↓
useEffect([id])
   ↓
GET /games/:id/releases
   ↓
Express backend
   ↓
PostgreSQL JOIN query
   ↓
JSON response
   ↓
setReleases()
   ↓
React re-render
Changing /games/1 to /games/2 changes id and causes a new release request.
16. Release Rendering
The frontend renders each release with:
{release.platform} - {release.region} - {release.release_format} -
{release.release_date.slice(0, 10)}
The release ID is used as the React list key.
The backend also returns title and notes; these fields are not currently rendered by the frontend release list.
17. AI Summary UI Flow
The AI-summary action is started by a button in GameDetails.
The function uses async/await:
User clicks Generate AI Summary
          ↓
setAiLoading(true)
          ↓
POST /games/:id/ai-summary
          ↓
Express backend
          ↓
MongoDB metadata lookup
          ↓
PostgreSQL release query
          ↓
Build prompt
          ↓
Gemini structured-output request
          ↓
MongoDB update
          ↓
JSON response
          ↓
setAiSummary(data.summary)
          ↓
Render structured fields
The button is disabled while generation is in progress.
18. AI Summary State and Error Handling
Before an AI request:
setAiLoading(true);
setAiError(null);
A non-2xx response produces an exception using the backend's error field.
The catch block stores the message in aiError, and finally resets aiLoading.
The button text changes between:
- Generate AI Release Summary
- Generating AI Summary...
The UI renders the error with aiError and displays the summary when aiSummary is non-null.
Backend Detailed Design
19. Backend Entry Point
The main backend file is:
backend/server.js
It imports:
- cors
- express
- PostgreSQL pool from ./db
- MongoDB connection function from ./mongo
- AI helper functions from ./gemini
An Express application instance is created with:
const app = express();
20. Middleware Configuration
The backend registers CORS and JSON parsing before the routes.
CORS
const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: frontendUrl
    })
);
The allowed origin is therefore environment-configurable, with localhost as the default.
JSON body parsing
app.use(express.json());
This allows metadata request bodies to be read from req.body.
21. Backend Startup Sequence
The server uses an asynchronous startup function:
async function startServer() {
    try {
        mongoDb = await connectMongoDB();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, "0.0.0.0", ...);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}
The important sequence is:
Process starts
   ↓
connectMongoDB()
   ↓
MongoDB connection succeeds
   ↓
mongoDb reference is stored
   ↓
Express starts listening
If MongoDB connection fails, the catch block logs the error and app.listen() is not reached.
The server listens on 0.0.0.0, which allows the containerized backend to accept connections from outside the container.
22. PostgreSQL Connection Pool
backend/db.js creates a PostgreSQL pool:
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
The pool is exported and reused by route handlers.
Using Pool avoids creating a brand-new database connection for every SQL request and lets pg manage reusable connections.
23. GET / Endpoint
The root endpoint is:
GET /
Response:
Game Release API is running!
This acts as a simple backend status message.
24. GET /games Endpoint
Purpose: retrieve games, optionally filtered by a case-insensitive partial title search.
Without search
The backend executes:
SELECT *
FROM games
ORDER BY title ASC;
With search
The backend executes:
SELECT *
FROM games
WHERE title ILIKE $1
ORDER BY title ASC;
with the parameter:
[`%${search}%`]
ILIKE provides case-insensitive matching and % on both sides makes the search a partial match.
The endpoint returns result.rows as JSON.
25. Parameterized SQL
The backend does not concatenate the search term directly into the SQL statement.
Instead, PostgreSQL parameters are used:
SQL statement: ... ILIKE $1 ...
Parameter:     %resident%
This keeps user input separate from the SQL command and helps prevent SQL injection.
The releases and AI-summary PostgreSQL queries also use $1 parameters.
26. GET /games/:id/releases Endpoint
Purpose: retrieve all release records for one game and return readable platform and region names.
The route reads:
const { id } = req.params;
The SQL query is:
SELECT
    g.title,
    r.id,
    p.name AS platform,
    reg.name AS region,
    r.release_format,
    r.release_date,
    r.notes
FROM releases r
JOIN games g ON r.game_id = g.id
JOIN platforms p ON r.platform_id = p.id
JOIN regions reg ON r.region_id = reg.id
WHERE r.game_id = $1
ORDER BY r.release_date ASC;
The route passes the raw route parameter as [id].
Validation detail
Unlike the metadata and AI-summary routes, this endpoint currently does not validate that id is an integer before executing the query.
A database/query failure is handled by the route's try/catch and returned as HTTP 500.
27. Release SQL JOINs
The release query performs three joins:
JOIN games g ON r.game_id = g.id
JOIN platforms p ON r.platform_id = p.id
JOIN regions reg ON r.region_id = reg.id
These joins convert foreign-key IDs into useful response fields:
- g.title → game title
- p.name → platform name
- reg.name → region name
The query therefore keeps the database normalized while giving the frontend a convenient flattened response.
MongoDB Metadata Design
28. MongoDB Connection
The MongoDB connection is implemented in:
backend/mongo.js
A MongoClient is created with:
const client = new MongoClient(process.env.MONGODB_URI);
The application uses database:
game_release_database
and collection:
game_metadata
The connection function returns the database object to server.js.
29. MongoDB Collection Validation
The game_metadata collection uses a MongoDB $jsonSchema validator.
Validation is configured with:
validationLevel: "strict"
validationAction: "error"
Required top-level fields are:
- gameId
- title
- developer
- publisher
- genres
- aliases
- notes
- sources
- updatedAt
This means invalid documents are rejected by MongoDB instead of being silently accepted.
30. MongoDB Metadata Schema
The main field types are:
Field	Type	Description
gameId	int / long	Corresponding PostgreSQL game ID
title	string	Game title
developer	string	Developer name
publisher	string	Publisher name
genres	array of strings	Game genres
aliases	array of strings	Alternate names
notes	array of strings	Metadata notes
sources	array of objects	External/source references
updatedAt	date	Last metadata update time
aiSummary	object, optional	Cached structured Gemini output


Each sources object requires:
- name
- url
- note
31. MongoDB AI Summary Schema
aiSummary is optional in the top-level metadata document.
When present, it requires exactly these logical fields:
Field	Type
summary	string
releaseCount	integer / long
platforms	array of strings
regions	array of strings
releaseFormats	array of strings
notablePatterns	array of strings


This schema mirrors the structured response requested from Gemini.
32. Unique Game Metadata Index
The application creates:
await db.collection("game_metadata").createIndex(
    { gameId: 1 },
    { unique: true }
);
This enforces one metadata document per PostgreSQL game ID.
The API therefore treats gameId as the logical identifier linking MongoDB metadata to the corresponding relational game record.
This is an application-level relationship; there is no cross-database foreign-key constraint between PostgreSQL and MongoDB.
33. POST /games/:id/metadata
Purpose: create the supplementary MongoDB metadata document for a game.
Processing
1. Convert req.params.id using Number().
2. Verify Number.isInteger(gameId).
3. Read metadata fields from req.body.
4. Add updatedAt: new Date().
5. Insert the document into game_metadata.
6. Return the inserted MongoDB ID.
Invalid ID
Returns:
400 Bad Request
with:
{"error":"Invalid game ID"}
Duplicate metadata
MongoDB's unique index produces duplicate-key error code 11000.
The route maps that to:
409 Conflict
Other insertion/validation errors
The route returns:
400 Bad Request
with a generic creation error message.
34. GET /games/:id/metadata
Purpose: retrieve one metadata document by its logical PostgreSQL gameId.
Processing:
Route parameter
   ↓
Number(id)
   ↓
integer validation
   ↓
MongoDB findOne({ gameId })
Responses:
- invalid ID → 400
- metadata not found → 404
- success → 200
- MongoDB failure → 500
The complete MongoDB document is returned as JSON when successful.
35. PUT /games/:id/metadata
Purpose: replace the editable metadata fields on an existing document using MongoDB updateOne.
The route updates:
- title
- developer
- publisher
- genres
- aliases
- notes
- sources
- updatedAt
The filter is:
{ gameId }
The update does not use upsert, so a missing metadata record is not created automatically.
Responses:
- invalid ID → 400
- no matching document → 404
- success → 200
- update/validation failure → 400
36. DELETE /games/:id/metadata
Purpose: delete the metadata document associated with one game.
The route executes:
deleteOne({ gameId })
Responses:
- invalid ID → 400
- no document deleted → 404
- success → 200
- MongoDB failure → 500
Gemini Integration
37. Gemini Module
The AI integration is implemented in:
backend/gemini.js
The SDK is initialized as:
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
The module exports:
- generateText
- buildReleaseSummaryPrompt
- generateStructuredReleaseSummary
Only buildReleaseSummaryPrompt and generateStructuredReleaseSummary are used by the AI-summary application route.
38. Release Summary Prompt
buildReleaseSummaryPrompt(gameTitle, releases) creates a prompt containing:
- the game title
- the release data supplied by PostgreSQL
The prompt explicitly instructs Gemini to use only supplied release data and not invent or assume facts.
The analysis requested covers:
1. total release count
2. platforms represented
3. regions represented
4. release formats represented
5. notable patterns visible in the supplied data
Important data boundary
The current AI prompt does not send the MongoDB metadata fields such as developer, publisher, genres, aliases, notes, or sources to Gemini.
MongoDB metadata is used to verify that a metadata document exists and to store the resulting aiSummary; the release analysis itself is based on PostgreSQL release data plus the game title.
39. Gemini Structured Output Schema
The application requests JSON output using:
responseMimeType: "application/json"
and supplies releaseSummarySchema as the response schema.
The schema requires six fields:
summary
releaseCount
platforms
regions
releaseFormats
notablePatterns
The backend parses the returned text using:
JSON.parse(response.text)
The parsed JavaScript object is then stored in MongoDB as aiSummary.
40. POST /games/:id/ai-summary
This endpoint is the main cross-database and AI workflow.
Step 1 — Validate game ID
const gameId = Number(req.params.id);

if (!Number.isInteger(gameId)) {
    return res.status(400)...
}
Step 2 — Verify MongoDB metadata
The backend executes:
findOne({ gameId })
If there is no metadata document, the endpoint returns:
404 Game metadata not found
Step 3 — Retrieve PostgreSQL release data
The backend performs the same normalized JOIN pattern used by the release endpoint, filtered by the validated gameId.
If no release rows are returned:
404 Game releases not found
Step 4 — Build release objects
Each row is reduced to:
platform
region
release_format
release_date
notes
Step 5 — Build Gemini prompt
buildReleaseSummaryPrompt(gameTitle, releases) creates the analysis prompt.
Step 6 — Generate structured summary
generateStructuredReleaseSummary(prompt) calls Gemini using the configured model and structured response schema.
Step 7 — Persist the result
MongoDB updateOne stores:
aiSummary: summary
updatedAt: new Date()
Step 8 — Return the result
The route returns:
{
  "gameId": 1,
  "title": "...",
  "summary": {
    "summary": "...",
    "releaseCount": 2,
    "platforms": ["..."],
    "regions": ["..."],
    "releaseFormats": ["..."],
    "notablePatterns": ["..."]
  }
}
Successful response status is 200.
41. AI Summary Error Handling
The AI-summary route uses one outer try/catch.
Specific handled conditions before the outer error handler include:
- invalid integer game ID → 400
- missing MongoDB metadata → 404
- no PostgreSQL releases → 404
- no MongoDB document matched during the final update → 404
Unexpected database, Gemini, JSON parsing, or other runtime failures reach the outer catch and return:
500 Internal Server Error
with:
{"error":"Failed to generate AI release summary"}
Detailed errors are written to the server console through console.error(error).
Relational Database Detailed Design
42. PostgreSQL Tables
The relational schema consists of four tables:
- games
- platforms
- regions
- releases
The schema is created in:
database/schema.sql
43. games Table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT
);
Column	Type	Constraint / purpose
id	SERIAL	Primary key
title	VARCHAR(255)	Required game title
description	TEXT	Optional description
cover_image	TEXT	Optional image reference


44. platforms Table
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
Each platform has a generated integer identifier and a required name.
45. regions Table
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL
);
The table stores both a human-readable region name and a region code.
46. releases Table
CREATE TABLE releases (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id),
    platform_id INTEGER NOT NULL REFERENCES platforms(id),
    region_id INTEGER NOT NULL REFERENCES regions(id),
    release_format VARCHAR(20) NOT NULL,
    release_date DATE,
    notes TEXT
);
Column	Type	Constraint / purpose
id	SERIAL	Primary key
game_id	INTEGER	Foreign key to games(id)
platform_id	INTEGER	Foreign key to platforms(id)
region_id	INTEGER	Foreign key to regions(id)
release_format	VARCHAR(20)	Required release format
release_date	DATE	Optional release date
notes	TEXT	Optional release notes


47. Relational Relationships
The relational structure is:
                    games
                      │
                      │ 1-to-many
                      ▼
                   releases
                  /         \
                 /           \
        many-to-one       many-to-one
             /                   \
            ▼                     ▼
       platforms               regions
More precisely:
- one game can have many releases
- one platform can be referenced by many releases
- one region can be referenced by many releases
- each release references one game, one platform, and one region
Foreign-key constraints enforce referential integrity.
48. Database Initialization and Seed Data
The Docker Compose PostgreSQL service mounts:
./database/schema.sql
./database/seed.sql
into PostgreSQL's Docker initialization directory.
The seed data currently includes:
- Resident Evil 4
- Sonic Adventure 2
- multiple platforms
- multiple regions
- release records for the seeded games
The seed file also contains a JOIN example showing how release rows can be combined with game, platform, and region information.
Because PostgreSQL initialization scripts run when a database volume is first initialized, changing seed SQL does not automatically replace data in an already-initialized named volume.
Cross-Database Data Model
49. PostgreSQL-to-MongoDB Logical Link
The application has a logical cross-database relationship:
PostgreSQL games.id
        │
        │ same numeric value
        ▼
MongoDB game_metadata.gameId
This relationship is not enforced by a database-level foreign key because PostgreSQL and MongoDB are separate database systems.
The application enforces the expected identifier type on metadata and AI-summary routes by converting the route parameter to a JavaScript Number and requiring Number.isInteger(gameId).
The MongoDB unique index ensures there is at most one metadata document for a given gameId.
50. End-to-End API/Data Flows
50.1 Search games
User enters text
      ↓
search state changes
      ↓
GET /games?search=term
      ↓
Express reads req.query.search
      ↓
PostgreSQL ILIKE $1
      ↓
ORDER BY title ASC
      ↓
result.rows
      ↓
JSON response
      ↓
setGames()
      ↓
React renders game list
50.2 View releases
User selects game
      ↓
navigate(/games/:id)
      ↓
useParams() reads id
      ↓
GET /games/:id/releases
      ↓
PostgreSQL JOINs games/platforms/regions
      ↓
filter by game_id
      ↓
order by release_date
      ↓
JSON response
      ↓
setReleases()
      ↓
React renders releases
50.3 Manage metadata
Client request
      ↓
Express route
      ↓
integer gameId validation
      ↓
MongoDB game_metadata collection
      ↓
success / 404 / validation / duplicate handling
      ↓
JSON response
50.4 Generate AI summary
POST /games/:id/ai-summary
          ↓
Validate integer gameId
          ↓
MongoDB findOne({ gameId })
          ↓
PostgreSQL release JOIN query
          ↓
Build prompt from game title + release data
          ↓
Gemini structured JSON generation
          ↓
JSON.parse(response.text)
          ↓
MongoDB updateOne({ gameId }, {$set: {aiSummary, updatedAt}})
          ↓
Return gameId + title + structured summary
Error Handling and Security
51. Backend Error Handling Pattern
Database-backed routes generally follow:
Request
  ↓
try
  ↓
Database/API work
  ↓
success response

or

runtime failure
  ↓
catch
  ↓
console.error(error)
  ↓
Generic JSON error response
The frontend then checks response.ok and converts backend errors into UI state.
The implementation avoids sending raw PostgreSQL or Gemini error details to the browser.
52. Input Validation
Current explicit route-parameter validation exists on:
- POST metadata
- GET metadata
- PUT metadata
- DELETE metadata
- POST AI summary
These routes use:
const gameId = Number(req.params.id);

if (!Number.isInteger(gameId)) {
    return res.status(400)...
}
The release retrieval route is the exception: it currently passes the raw id parameter to PostgreSQL without explicit integer validation.
MongoDB collection-level schema validation provides additional validation for metadata documents.
53. Security Measures Implemented
Parameterized SQL
Search terms and validated game IDs are supplied as SQL parameters instead of string concatenation.
Backend-only secrets
Database credentials and the Gemini API key are loaded by the backend and are not exposed as frontend VITE_* variables.
Restricted CORS
The backend accepts a configurable frontend origin instead of unrestricted cors().
MongoDB schema validation
The game_metadata collection rejects documents that do not satisfy the configured JSON schema.
Unique metadata index
A unique index on gameId prevents duplicate metadata records for the same logical game.
54. Current Security and Reliability Limitations
The current implementation does not include:
- authentication
- authorization
- rate limiting
- request-level authorization checks
- HTTPS termination in the application itself
- comprehensive request-body validation outside MongoDB schema validation
- centralized error middleware
- request cancellation/debouncing for rapid searches
- caching
- pagination
- automated tests in the backend package scripts
These are not currently part of the implemented MVP behavior.
Deployment and Container Design
55. Docker Compose Services
docker-compose.yml defines three services:
1. postgres
2. backend
3. frontend
PostgreSQL
- image: postgres:16-alpine
- host port: 5432
- named volume: postgres_data
- schema and seed files are mounted as initialization scripts
Backend
- built from ./backend
- host port 3000
- depends on the PostgreSQL service
- receives backend environment configuration from backend/.env plus database variables in the Compose file
Frontend
- built from ./frontend
- host port 5173 mapped to Nginx port 80
- receives VITE_API_URL as a build argument
- depends on the backend service
56. Backend Container
The backend Dockerfile uses:
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
Important implementation details:
- dependencies are installed with npm ci --omit=dev
- application files are copied with ownership assigned to the node user
- the container runs as the non-root node user
- port 3000 is exposed
- the application is started with npm start
57. Frontend Container
The frontend uses a multi-stage build.
Build stage
The Vite application is built with Node 20 Alpine.
VITE_API_URL is passed as a build argument and environment variable before npm run build.
Runtime stage
The generated dist directory is copied into:
/usr/share/nginx/html
and Nginx serves the static bundle.
The custom Nginx configuration uses:
try_files $uri $uri/ /index.html;
so React Router client-side routes can resolve back to index.html on direct navigation.
Supporting Development Artifacts
58. Hoisting Demo
backend/hoisting-demo.js demonstrates JavaScript behavior around:
- var hoisting
- let / const temporal dead zone behavior
- block scope
It is a conceptual/demo file, not part of the Express application runtime.
59. Event Loop Demo
backend/event-loop-demo.js demonstrates ordering between:
- synchronous statements
- an asynchronous fs callback
- a Promise microtask
- setTimeout
It is supporting evidence for JavaScript event-loop concepts and is not called by the application routes.
60. Callbacks vs Promises Demo
backend/promises-callbacks-demo.js contrasts:
- nested callbacks
- explicit Promise .then() chaining
- a final .catch()
The example models a MongoDB → PostgreSQL → Gemini → MongoDB-style workflow.
The production application does not implement the AI-summary route with this Promise-chaining style. The current route uses async/await, while this file is only a conceptual demonstration.
Design Decisions
61. Why PostgreSQL and MongoDB Are Both Used
PostgreSQL is used for normalized relational release data because games, platforms, regions, and releases have clear relationships and foreign-key constraints.
MongoDB is used for supplementary game metadata because the metadata document can contain arrays, nested source objects, and an optional structured AI-summary object without adding many relational tables.
The split also allows the AI-generated summary to be stored alongside the metadata document while preserving the release dataset in PostgreSQL.
62. Why React Router Is Used
The selected game is represented by /games/:id rather than a selectedGame state variable.
This gives each game details page a URL that can be refreshed or navigated to directly, subject to the configured Nginx fallback behavior in deployment.
63. Why Parameterized Queries Are Used
Parameterized queries separate SQL syntax from user-provided values and reduce the risk of SQL injection.
They are used for the title search and the game ID in the database queries.
64. Why Structured Gemini Output Is Used
The AI summary is consumed by React as data, not as a free-form paragraph only.
A response schema guarantees the expected logical structure:
summary
releaseCount
platforms
regions
releaseFormats
notablePatterns
This makes rendering predictable and also allows the same structure to be persisted in MongoDB.
65. Current API Reference
Method	Endpoint	Main purpose	Success	Important errors
GET	/	API status	200	—
GET	/games	List games	200	500
GET	/games?search=term	Search titles	200	500
GET	/games/:id/releases	List releases	200	500
POST	/games/:id/metadata	Create metadata	201	400, 409
GET	/games/:id/metadata	Fetch metadata	200	400, 404, 500
PUT	/games/:id/metadata	Update metadata	200	400, 404
DELETE	/games/:id/metadata	Delete metadata	200	400, 404, 500
POST	/games/:id/ai-summary	Generate/store AI summary	200	400, 404, 500


66. Current Architecture Summary
The current implementation is best understood as:
Presentation
    React 19 + Vite + React Router + Fetch
                 │
                 │ HTTP / JSON
                 ▼
Application
    Node.js + Express
       │       │
       │       ├──────────────► MongoDB
       │       │                 game_metadata
       │       │                 aiSummary
       │       │
       │       └──────────────► PostgreSQL
       │                         games
       │                         platforms
       │                         regions
       │                         releases
       │
       └──────────────────────► Google Gemini API
                                  structured release summary
The central backend coordinates the three external data/service dependencies: PostgreSQL for relational release data, MongoDB for flexible metadata and stored AI summaries, and Gemini for on-demand structured analysis.
The current implementation remains intentionally small and MVP-oriented, with the main application logic concentrated in frontend/src/App.jsx and backend/server.js rather than split into multiple service/controller/repository layers.