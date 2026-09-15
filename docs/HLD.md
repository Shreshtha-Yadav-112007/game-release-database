Game Release Database — High-Level Design
1. System Overview

The Game Release Database is a full-stack web application that allows users to search for video games and view their release information across different platforms, regions, and release formats.

The system is divided into three primary layers:

Frontend
Backend
Database

The frontend provides the user interface and handles user interactions.

The backend provides a REST-style API that processes requests from the frontend and communicates with PostgreSQL.

The database stores games, releases, platforms, regions, and their relationships.

The overall architecture follows a simple client-server model with a separate persistent data layer.

2. System Architecture

The application follows a three-layer architecture:

┌─────────────────────────────┐
│       Frontend Layer        │
│                             │
│ React 19 + Vite             │
│ React Router DOM            │
│ Fetch API                   │
│ CSS                         │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│       Backend Layer         │
│                             │
│ Node.js + Express 5         │
│ CORS                        │
│ pg Pool                     │
│ REST API                    │
└──────────────┬──────────────┘
               │
               │ SQL
               ▼
┌─────────────────────────────┐
│        Database Layer       │
│                             │
│ PostgreSQL                  │
│                             │
│ games                       │
│ releases                    │
│ platforms                   │
│ regions                     │
└─────────────────────────────┘

The frontend does not communicate directly with PostgreSQL. All database access is performed by the backend.

This separation keeps presentation, application logic, and persistent data responsibilities distinct. The existing HLD correctly identifies this three-layer separation.

3. Technology Stack
Layer	Technology	Purpose
Frontend	React 19	User interface and state management
Frontend tooling	Vite	Development/build tooling
Routing	React Router DOM	Client-side navigation
HTTP communication	Fetch API	Communication with backend
Styling	CSS	Layout and responsive styling
Backend	Node.js	JavaScript runtime
Backend framework	Express 5	HTTP server and API routing
Database client	pg	PostgreSQL communication
Database	PostgreSQL	Persistent relational storage
Environment configuration	dotenv	Database/environment configuration
Cross-origin support	CORS	Frontend/backend communication
4. Frontend Layer

The frontend is implemented using React 19 with Vite.

The main application logic is located in:

frontend/src/App.jsx

The frontend currently contains two main React components:

App
GameDetails
Frontend responsibilities

The frontend is responsible for:

displaying the application interface
accepting game search input
retrieving games from the backend
displaying search results
navigating between game routes
retrieving release information
displaying releases
managing loading states
managing error states

The frontend uses React Router rather than maintaining a separate selectedGame state.

5. Frontend Routing

The application uses React Router DOM.

The main routes are:

/games
/games/:id
/games

Displays the game search interface and game list.

/games/:id

Displays the releases associated with a particular game.

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

This allows the URL itself to represent the currently viewed game.

6. Frontend State Management

The application uses React's useState hook.

The App component manages:

games
search
loading
error

The GameDetails component manages:

releases
loading
error
State flow

For game search:

search
  ↓
useEffect
  ↓
Fetch API
  ↓
setGames
  ↓
React re-render
  ↓
Game list

For releases:

URL id
  ↓
useParams
  ↓
useEffect([id])
  ↓
Fetch API
  ↓
setReleases
  ↓
React re-render
  ↓
Release list
7. Frontend API Communication

The frontend communicates with the backend using the browser's native fetch() API.

Game retrieval

When there is no search term:

GET /games

When a search term is entered:

GET /games?search={searchTerm}

The search term is passed through:

encodeURIComponent(search)

before being included in the URL.

Release retrieval

When a game is selected:

GET /games/:id/releases

The game ID comes from the current route using useParams().

8. Frontend Loading and Error Handling

The current implementation includes explicit loading and error handling.

Before requests, loading is enabled.

The frontend checks:

response.ok

If the response is unsuccessful, an error is thrown.

The error is then handled using .catch() and stored in React state.

Finally, .finally() is used to stop the loading state.

The UI can therefore communicate:

Loading games...

or:

Error: ...

and similarly for release retrieval.

This is an update from the older HLD, which described frontend loading/error handling as limited. The current implementation now has explicit loading/error state handling.

9. Backend Layer

The backend is implemented using Node.js and Express 5.

The main backend file is:

backend/server.js

The backend is responsible for:

receiving HTTP requests
processing route parameters and query parameters
executing SQL queries
communicating with PostgreSQL
returning JSON responses
handling database errors
configuring CORS

The backend acts as the intermediary between the React frontend and PostgreSQL.

The HLD's description of the backend's intermediary role remains consistent with the architecture.

10. Database Connection

The PostgreSQL connection is handled through:

backend/db.js

The application uses the pg package and a PostgreSQL Pool.

Environment variables are used for database configuration through dotenv.

The architecture is therefore:

Express route
      ↓
pool.query()
      ↓
PostgreSQL
      ↓
result.rows
      ↓
Express response

The frontend never receives or uses the database credentials directly.

11. CORS Architecture

The frontend and backend run on different local origins during development:

Frontend → http://localhost:5173
Backend  → http://localhost:3000

The backend uses CORS middleware:

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

This explicitly allows the frontend development origin to communicate with the API through the browser.

The current implementation therefore uses a restricted origin, rather than unrestricted cors().

This configuration is intended for the current local development environment.

12. API Layer

The backend exposes the following endpoints:

Method	Endpoint	Purpose
GET	/	API status
GET	/games	Retrieve all games
GET	/games?search={term}	Search games
GET	/games/:id/releases	Retrieve releases for a game

The API acts as the boundary between the frontend and database.

The frontend therefore does not need to know how PostgreSQL tables or SQL queries are structured.

13. Game Retrieval

The:

GET /games

endpoint retrieves games from PostgreSQL.

Without a search term, games are ordered alphabetically.

With a search term, PostgreSQL performs a case-insensitive partial title search using:

WHERE title ILIKE $1

with the parameter:

%search%

The query is parameterized to protect against SQL injection.

The results are returned as JSON.

14. Release Retrieval

The:

GET /games/:id/releases

endpoint retrieves releases associated with a particular game.

The backend:

extracts the ID from req.params
executes a parameterized SQL query
joins the relevant database tables
filters by game_id
orders the releases chronologically
returns the rows as JSON

The endpoint represents the relationship:

Game
  ↓
Releases

A game can therefore have multiple release records.

15. Database Layer

PostgreSQL is the persistent data layer.

The database contains four primary tables:

games
platforms
regions
releases

The database represents the relationship between a game and its different releases.

A release is associated with:

one game
one platform
one region
one release format
one release date

This structure allows the same game to have multiple release records without duplicating the game's basic information. The existing HLD also describes this as the primary database relationship.

16. Database Relationships

The high-level relationship is:

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

The database uses foreign keys to maintain these relationships.

This enables the system to represent releases across different combinations of platforms and regions.

17. End-to-End Game Search Flow

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
7. PostgreSQL executes parameterized query
          ↓
8. PostgreSQL returns matching games
          ↓
9. Express sends JSON response
          ↓
10. React checks response.ok
          ↓
11. setGames(data)
          ↓
12. React re-renders game list
18. End-to-End Release Flow

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
19. Error Handling Architecture

The system handles errors at both backend and frontend levels.

Backend

Database operations are inside try/catch.

If a database query fails:

Database error
      ↓
catch
      ↓
console.error(error)
      ↓
HTTP 500
      ↓
{ error: "Database query failed" }
Frontend

The frontend checks:

response.ok

and throws an error when the response is unsuccessful.

The .catch() handler stores the error in React state.

The UI then displays an error message.

This provides a complete basic error path from database failure to user-facing feedback.

20. Security Architecture

The current system includes several basic security measures.

Backend/database separation

The frontend does not directly access PostgreSQL.

Parameterized queries

User-provided search values and game IDs are passed to PostgreSQL using parameters.

This helps prevent SQL injection.

Restricted CORS

The backend currently allows the configured frontend origin:

http://localhost:5173
Environment variables

Database configuration is provided through environment variables rather than being hard-coded into the application.

21. Responsive Design

The frontend uses CSS media queries to adapt the layout for smaller screens.

The main responsive breakpoint currently used is:

@media (max-width: 1024px)

At this breakpoint, the system adjusts several parts of the layout.

#center

The padding and gap are reduced:

padding: 32px 20px 24px
gap: 18px

This prevents the content from becoming cramped on smaller screens.

Hero

The hero graphics are reduced in width, height, position, and transform scale.

#next-steps

The layout changes from a row to a column.

#docs

The border layout changes to better fit the smaller viewport.

Links

Links are allowed to wrap.

This responsive approach allows the existing desktop composition to adapt to smaller screens without introducing a separate mobile application.

22. Development Environment

During development, the three major parts run separately:

React/Vite Development Server
        │
        │ HTTP
        ▼
Node.js/Express Server
        │
        │ SQL
        ▼
PostgreSQL

The frontend runs on:

localhost:5173

The backend runs on:

localhost:3000

PostgreSQL runs separately and is accessed by the backend.

23. Git Development Workflow

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
review/diff
  ↓
merge into main

Recent feature commits include:

a53a86e
feat: add responsive styles to hero section
3ada0f7
feat: add loading and error states
c1c55ea
feat: configure restricted cors origin

This workflow provides isolated feature development and a traceable project history.

24. Scalability Considerations

The current architecture is intentionally simple because the application is an MVP.

The existing architecture can be extended if the dataset or user base grows.

Potential improvements include:

database indexes for frequently searched fields
pagination
improved search functionality
caching
more granular React components
additional backend service layers
production deployment
larger-scale database optimization

These are future improvements, not currently implemented features. The existing HLD similarly identifies indexes, pagination, caching, and additional backend layers as future scalability options.

25. Current System Limitations

The current MVP does not implement:

user accounts
authentication
authorization
user collections
advanced filtering
price tracking
community contributions
automated data ingestion
production deployment
large-scale optimization
game/remake/remaster relationship management

Search is currently focused on game titles.

Release data is maintained through the database's current seed/data workflow.

26. Future Architecture

The existing three-layer architecture provides a foundation for future features.

Potential additions include:

Advanced Search
      ↓
Game Relationships
      ↓
User Accounts
      ↓
User Collections
      ↓
Community Contributions
      ↓
Release Sources
      ↓
Automated Data Ingestion
      ↓
Production Deployment

These additions can be introduced without fundamentally changing the core:

React
  ↓
Express API
  ↓
PostgreSQL

architecture.

27. Design Principles
Separation of Concerns

Each layer has a distinct responsibility:

Frontend → UI and interaction
Backend  → API and application logic
Database → persistent data
Simplicity

The architecture avoids unnecessary services and technologies because the current goal is an MVP.

Maintainability

Separating the layers allows individual parts of the application to be modified without requiring the entire system to be redesigned.

Security

Database access is isolated behind the backend and user input is passed through parameterized queries.

Extensibility

The current API and relational database provide a foundation for additional functionality.

28. Architecture Summary

The Game Release Database currently uses a three-layer architecture:

┌─────────────────────────────┐
│          FRONTEND           │
│                             │
│ React 19                    │
│ Vite                        │
│ React Router DOM            │
│ Fetch API                   │
│ CSS                         │
│                             │
│ App                         │
│ GameDetails                 │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│           BACKEND           │
│                             │
│ Node.js                     │
│ Express 5                   │
│ CORS                        │
│ pg Pool                     │
│                             │
│ GET /                       │
│ GET /games                  │
│ GET /games?search=...       │
│ GET /games/:id/releases     │
└──────────────┬──────────────┘
               │
               │ SQL
               ▼
┌─────────────────────────────┐
│          DATABASE           │
│                             │
│ PostgreSQL                  │
│                             │
│ games                       │
│ platforms                   │
│ regions                     │
│ releases                    │
└─────────────────────────────┘

The complete application flow is:

User → React → Fetch → Express → PostgreSQL → Express → JSON → React → UI

The architecture is intentionally simple and appropriate for the current MVP while providing a foundation for future search, user, data-management, and deployment features.