Game Release Database — Low-Level Design
1. Overview

The Game Release Database is a full-stack web application that allows users to search for video games and view their release information across different platforms, regions, and release formats.

The application follows a three-layer architecture:

Frontend — React + Vite
Backend — Node.js + Express
Database — PostgreSQL

The frontend communicates with the backend through HTTP/REST API requests. The backend communicates with PostgreSQL using the pg library and a connection pool.

Technology Stack
Layer	Technology
Frontend	React 19
Frontend tooling	Vite
Routing	React Router DOM
Frontend HTTP communication	Fetch API
Backend runtime	Node.js
Backend framework	Express 5
Database	PostgreSQL
Database client	pg / PostgreSQL Pool
Environment variables	dotenv
Cross-origin communication	CORS
Styling	CSS
2. Project Structure

The repository is organized into four main areas:

game-release-database/
│
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   └── .env.example
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
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
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
└── README.md

The frontend, backend, database, and documentation are kept separate to maintain separation of concerns.

3. High-Level Architecture

The application follows this communication flow:

User
  ↓
React Frontend
  ↓ HTTP / Fetch API
Express Backend
  ↓ SQL / pg Pool
PostgreSQL
  ↓ Query Result
Express Backend
  ↓ JSON
React Frontend
  ↓
User Interface

The frontend does not communicate directly with PostgreSQL.

The backend acts as the intermediary between the user interface and the database.

This keeps database credentials and SQL operations on the server side.

4. Frontend Architecture

The frontend is implemented using React and Vite.

The main application logic is currently contained in:

frontend/src/App.jsx

The application currently has two React components:

App
GameDetails
Responsibilities of the frontend

The frontend is responsible for:

displaying the game list
accepting search input
requesting games from the backend
displaying loading states
displaying API errors
navigating to game detail routes
retrieving release information
displaying release information
5. React Application Entry Point

The application entry point is:

frontend/src/main.jsx

The application is rendered using:

<StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</StrictMode>
BrowserRouter

BrowserRouter enables client-side routing using React Router.

The App component therefore does not need to manually track which game is selected.

Instead, the selected game is represented by the URL.

6. React Components
6.1 App Component

The App component handles:

game list state
search state
game-list loading state
game-list error state
game search requests
navigation to game detail pages
route definitions

The state currently used in App is:

const [games, setGames] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
State responsibilities
State	Purpose
games	Stores games returned by the backend
search	Stores the current search input
loading	Tracks whether the games request is in progress
error	Stores an error message when the request fails

There is no selectedGame state in the current implementation.

Game selection is handled through React Router.

7. Game Search Flow

The search input is a controlled React input:

<input
  type="text"
  placeholder="Search for a game..."
  value={search}
  onChange={(event) => {
    setError(null);
    setLoading(true);
    setSearch(event.target.value);
  }}
/>

When the user types:

User input
   ↓
setSearch()
   ↓
search state changes
   ↓
useEffect runs
   ↓
GET /games?search=...
   ↓
Backend queries PostgreSQL
   ↓
JSON response
   ↓
setGames()
   ↓
React re-renders

The search value is encoded using:

encodeURIComponent(search)

before being placed into the URL.

8. Game Search useEffect

The App component uses:

useEffect(() => {
  const url = search
    ? `http://localhost:3000/games?search=${encodeURIComponent(search)}`
    : "http://localhost:3000/games";

  fetch(url)
    ...
}, [search]);

The dependency array is:

[search]

Therefore, the effect runs when the search value changes.

Behavior

If the search is empty:

GET /games

If the search is "resident":

GET /games?search=resident
9. Frontend Loading and Error Handling

The current implementation explicitly handles loading and errors.

The application checks the HTTP response:

if (!response.ok) {
  throw new Error(data.error || "Failed to fetch games");
}

If an error occurs:

.catch((error) => {
  console.error(error);
  setError(error.message);
})

The loading state is finalized using:

.finally(() => {
  setLoading(false);
})

The UI displays:

{loading && <p>Loading games...</p>}

and:

{error && <p>Error: {error}</p>}

Before a new search begins, the previous error is cleared and loading is restarted:

setError(null);
setLoading(true);
setSearch(event.target.value);

This provides basic user feedback while API requests are being processed.

10. React Router Architecture

The current application uses React Router.

The routes are:

<Route path="/games" ... />
<Route path="/games/:id" element={<GameDetails />} />
Games route
/games

displays the game list and search interface.

Game details route
/games/:id

represents a specific game's detail page.

For example:

/games/1

represents game ID 1.

11. Game Navigation

The App component uses:

const navigate = useNavigate();

When a game is clicked:

navigate(`/games/${game.id}`);

This changes the route without requiring a full page reload.

The flow is:

Click game
   ↓
navigate(`/games/${game.id}`)
   ↓
/games/:id
   ↓
GameDetails component
12. GameDetails Component

GameDetails is responsible for displaying the releases associated with the game represented by the current URL.

It obtains the ID using:

const { id } = useParams();

It stores release information using:

const [releases, setReleases] = useState([]);

It also has its own loading and error states:

const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

Therefore, GameDetails has three pieces of state:

State	Purpose
releases	Stores releases returned by the backend
loading	Tracks release request status
error	Stores release request errors
13. Release Retrieval

GameDetails uses:

useEffect(() => {
  fetch(`http://localhost:3000/games/${id}/releases`)
  ...
}, [id]);

The dependency array is:

[id]

Therefore, the effect runs whenever the game ID changes.

Flow
/games/1
   ↓
useParams()
   ↓
id = 1
   ↓
useEffect([id])
   ↓
GET /games/1/releases
   ↓
Express
   ↓
PostgreSQL
   ↓
JSON response
   ↓
setReleases()
   ↓
React re-render

If the user navigates to another game:

/games/2

the id changes and the effect performs a new request for game 2.

14. Release Error and Loading Handling

The release request checks:

if (!response.ok) {
  throw new Error(data.error || "Failed to fetch releases");
}

Errors are handled using:

.catch((error) => {
  console.error(error);
  setError(error.message);
})

The loading state is finalized using:

.finally(() => {
  setLoading(false);
})

The interface displays:

{loading && <p>Loading releases...</p>}

and:

{error && <p>Error: {error}</p>}
15. Release Display

Release information is rendered using:

{releases.map((release) => (
  <li key={release.id}>
    {release.platform} - {release.region} - {release.release_format} -{" "}
    {release.release_date.slice(0, 10)}
  </li>
))}

The frontend currently displays:

platform
region
release format
release date

The release ID is used as the React list key.

The date is shortened using:

release.release_date.slice(0, 10)

so that only the relevant date portion is displayed.

16. Backend Architecture

The backend is implemented using:

Node.js
Express
PostgreSQL
pg
dotenv
CORS

The primary backend file is:

backend/server.js

The database connection is defined in:

backend/db.js
17. PostgreSQL Connection

backend/db.js imports Pool from pg:

const { Pool } = require("pg");

Environment variables are loaded using:

require("dotenv").config();

A PostgreSQL connection pool is created using:

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

The pool is exported:

module.exports = pool;

The backend therefore reuses the PostgreSQL connection pool when executing queries.

18. CORS Configuration

The backend uses CORS middleware:

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

The frontend runs on:

http://localhost:5173

while the backend runs on:

http://localhost:3000

Because these are different origins, CORS is required for browser-based communication.

The current configuration specifically allows the frontend origin:

http://localhost:5173

rather than using unrestricted cors().

This configuration is intended for the current local development environment.

19. API Endpoints

The current backend exposes three endpoints.

Method	Endpoint	Purpose
GET	/	API status message
GET	/games	Retrieve all games
GET	/games?search={term}	Search games by title
GET	/games/:id/releases	Retrieve releases for a specific game
20. GET / Endpoint

The root endpoint is:

app.get("/", (req, res) => {
  res.send("Game Release API is running!");
});

It provides a simple API status response.

21. GET /games Endpoint

The games endpoint is:

app.get("/games", async (req, res) => {

The search value is obtained using:

const { search } = req.query;

There are two query paths.

Without search
SELECT *
FROM games
ORDER BY title ASC;

This returns all games alphabetically.

With search
SELECT *
FROM games
WHERE title ILIKE $1
ORDER BY title ASC;

The parameter is:

[`%${search}%`]

The combination of:

ILIKE

and:

%search%

provides case-insensitive partial title matching.

For example:

resident

can match:

Resident Evil 4
22. Parameterized Queries

The backend uses PostgreSQL parameter placeholders:

$1

instead of directly inserting user input into the SQL string.

For example:

pool.query(
    `
    SELECT *
    FROM games
    WHERE title ILIKE $1
    ORDER BY title ASC;
    `,
    [`%${search}%`]
);

This keeps the SQL structure separate from user-provided data and helps prevent SQL injection.

The same approach is used for the game ID in the releases endpoint.

23. GET /games/:id/releases

The release endpoint is:

app.get("/games/:id/releases", async (req, res) => {

The game ID is obtained from:

const { id } = req.params;

The query is:

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

The ID is supplied separately:

[id]
24. SQL JOIN Structure

The release query uses three joins.

Releases → Games
JOIN games g ON r.game_id = g.id

This connects each release to its game.

Releases → Platforms
JOIN platforms p ON r.platform_id = p.id

This allows the API to return the platform name.

Releases → Regions
JOIN regions reg ON r.region_id = reg.id

This allows the API to return the region name.

The query therefore converts the foreign-key relationships in the database into useful information for the frontend.

25. Release Filtering and Ordering

The endpoint filters using:

WHERE r.game_id = $1

Therefore, only releases belonging to the requested game are retrieved.

The results are ordered using:

ORDER BY r.release_date ASC

so releases are returned chronologically.

Filtering, joining, and ordering are performed by PostgreSQL before the results are returned to the frontend.

26. API Response Structure

The backend returns:

res.json(result.rows);

For the release endpoint, the returned records contain fields such as:

title
id
platform
region
release_format
release_date
notes

The frontend currently consumes:

release.id
release.platform
release.region
release.release_format
release.release_date

This allows GameDetails to directly render the returned data without performing additional database-style joins in React.

27. Backend Error Handling

Both database endpoints use:

try {
    ...
} catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
}

This provides two levels of handling.

Server side
console.error(error);

logs the detailed error for debugging.

Client side
res.status(500).json({
    error: "Database query failed"
});

returns a generic error message instead of exposing internal database details.

The frontend then checks:

if (!response.ok)

and throws an error so its .catch() block can display the error to the user.

28. HTTP Status Behavior

Successful responses use:

res.json(result.rows);

which results in HTTP 200 OK.

An empty query result is not currently considered an error.

For example, if a search matches no games:

[]

is returned with a successful response.

Database/query failures explicitly return:

500 Internal Server Error

The current implementation does not explicitly implement 400, 401, 403, or 404 responses.

29. Database Design

The database uses four main tables:

games
platforms
regions
releases

The database is defined in:

database/schema.sql
30. Games Table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT
);
Columns
Column	Type	Purpose
id	SERIAL	Primary key
title	VARCHAR(255)	Game title
description	TEXT	Optional description
cover_image	TEXT	Optional cover image
31. Platforms Table
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

Each platform has a unique identifier and name.

Examples in the seed data include:

Gamecube
Playstation 2
PC
Wii
Dreamcast
Playstation 3
Xbox 360
32. Regions Table
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL
);

The table stores:

region name
region code

The current seed data includes:

North America — NA
Japan — JP
PAL — PAL
Worldwide — WW
33. Releases Table
CREATE TABLE releases (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id),
    platform_id INTEGER NOT NULL REFERENCES platforms(id),
    region_id INTEGER NOT NULL REFERENCES regions(id),
    release_format VARCHAR(20) NOT NULL,
    release_date DATE,
    notes TEXT
);

A release contains:

release ID
game reference
platform reference
region reference
release format
release date
optional notes
34. Database Relationships

The relationships are:

games
  1
  |
  | many
  ↓
releases
  ↑       ↑
  |       |
many     many
  |       |
platforms regions

More precisely:

One game can have many releases.
One platform can have many releases.
One region can have many releases.
Each release belongs to one game.
Each release belongs to one platform.
Each release belongs to one region.

These relationships are enforced through foreign keys.

35. Referential Integrity

The release table contains:

game_id INTEGER NOT NULL REFERENCES games(id)
platform_id INTEGER NOT NULL REFERENCES platforms(id)
region_id INTEGER NOT NULL REFERENCES regions(id)

These foreign keys ensure that referenced game, platform, and region records must exist according to the database's referential-integrity rules.

This prevents releases from referencing nonexistent parent records.

36. Seed Data

The database is populated using:

database/seed.sql

The current seed data contains:

Games
Resident Evil 4
Sonic Adventure 2
Releases

Resident Evil 4:

Gamecube — North America — Physical — 2005-01-11
Gamecube — Japan — Physical — 2005-01-27

Sonic Adventure 2:

Dreamcast — North America — Physical — 2001-06-19

The seed file also contains a standalone SQL JOIN example demonstrating how release information can be combined with game, platform, and region information.

37. Frontend Styling and Responsive Design

The main application styling is contained in:

frontend/src/App.css
frontend/src/index.css

The project uses CSS media queries at the 1024px breakpoint.

The responsive styling adapts:

hero graphics
center section spacing
next-steps layout
documentation section borders
links
spacer height
typography
38. Responsive #center Section

The #center section normally uses:

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;
}

At smaller viewport widths:

#center {
  padding: 32px 20px 24px;
  gap: 18px;
}

inside:

@media (max-width: 1024px)

This reduces horizontal spacing and the gap between elements so the layout fits smaller screens more comfortably.

39. Responsive Hero

The .hero section also uses the 1024px breakpoint.

At smaller widths:

.base {
  width: 140px;
}

instead of the normal 170px.

The framework graphic changes from:

top: 34px
height: 28px
scale: 1.4

to:

top: 28px
height: 24px
scale: 1.2

The Vite graphic changes from:

top: 107px
height: 26px
scale: 0.8

to:

top: 88px
height: 22px
scale: 0.7

These changes reduce the size and positioning of the hero graphics on smaller screens to maintain the composition and prevent crowding.

40. Other Responsive Layout Changes

At max-width: 1024px, #next-steps changes from a horizontal layout to a vertical layout:

flex-direction: column;
text-align: center;

The #docs section changes from a right border to a bottom border:

border-right: none;
border-bottom: 1px solid var(--border);

The links also become responsive:

flex-wrap: wrap;
justify-content: center;

and list items use:

flex: 1 1 calc(50% - 8px);

This allows the layout to adapt to narrower screens.

41. Dark Mode and Base Styling

index.css defines CSS variables for:

text colors
backgrounds
borders
accents
shadows
fonts

The stylesheet also includes:

@media (prefers-color-scheme: dark)

to provide dark-mode variable values when the user's operating system/browser prefers dark mode.

The root font size is also reduced at:

@media (max-width: 1024px)

from 18px to 16px.

42. Security Considerations

The current implementation includes several basic security measures.

Parameterized SQL

Search values and game IDs are passed as parameters rather than concatenated directly into SQL.

This helps protect against SQL injection.

Database isolation

The frontend never directly connects to PostgreSQL.

Database credentials remain on the backend.

CORS restriction

The current CORS configuration allows the known frontend origin:

http://localhost:5173
Environment variables

Database credentials are loaded using dotenv rather than hard-coded directly into the database connection configuration.

43. Current Security Limitations

The current MVP does not implement:

authentication
authorization
rate limiting
HTTPS configuration
user accounts
production security configuration
comprehensive input validation

These are outside the current MVP scope.

44. Current Error-Handling Architecture

The current error flow is:

PostgreSQL/database error
        ↓
Express try/catch
        ↓
console.error()
        ↓
HTTP 500 JSON
        ↓
Frontend fetch()
        ↓
response.ok === false
        ↓
throw Error
        ↓
catch()
        ↓
setError()
        ↓
Display error message

Both game retrieval and release retrieval follow this pattern.

45. Current Limitations

The current implementation is an MVP and does not currently include:

user accounts
authentication
authorization
advanced filtering
game relationship management
remake/remaster relationships
user collections
price tracking
community contributions
automated data ingestion
production deployment
pagination
caching
large-scale database optimization
comprehensive request validation
request cancellation for overlapping frontend fetches

The current frontend also does not use a separate component architecture for the game list, search form, or release list; the main logic remains in App.jsx and GameDetails.

46. Current API/Data Flow Summary
Searching for games
User enters search
       ↓
setSearch()
       ↓
search state changes
       ↓
useEffect([search])
       ↓
Fetch GET /games?search=...
       ↓
Express reads req.query.search
       ↓
Parameterized PostgreSQL query
       ↓
PostgreSQL
       ↓
result.rows
       ↓
res.json()
       ↓
response.ok check
       ↓
setGames()
       ↓
React re-render
       ↓
games.map()
Viewing releases
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
       ↓
useEffect([id])
       ↓
Fetch GET /games/:id/releases
       ↓
Express reads req.params.id
       ↓
Parameterized SQL + JOINs
       ↓
PostgreSQL
       ↓
result.rows
       ↓
res.json()
       ↓
response.ok check
       ↓
setReleases()
       ↓
React re-render
       ↓
releases.map()
47. Git Development Workflow

The project was developed using feature branches and pull requests.

The general workflow is:

main
 ↓
Create feature branch
 ↓
Implement change
 ↓
Commit changes
 ↓
Create Pull Request
 ↓
Review changes/diff
 ↓
Merge into main

The commit history contains separate development work for individual features.

Recent implementation commits include:

Responsive hero
a53a86e
feat: add responsive styles to hero section

This added responsive styling for the hero graphics at the existing 1024px breakpoint.

Loading and error states
3ada0f7
feat: add loading and error states

This introduced frontend loading/error state handling in App.jsx.

Restricted CORS
c1c55ea
feat: configure restricted cors origin

This changed the backend CORS configuration to allow the frontend development origin explicitly.

The branch-and-PR workflow keeps individual feature changes isolated and provides a traceable history of implementation.

48. Design Principles

The current implementation follows several basic principles.

Separation of concerns

The frontend handles presentation and user interaction.

The backend handles API requests and database communication.

PostgreSQL handles persistent data storage.

Simplicity

The architecture uses a small number of technologies and avoids unnecessary layers because the application is currently an MVP.

Parameterized database access

User-provided values are passed separately from SQL statements.

Database-side processing

Filtering, joining, and ordering are performed by PostgreSQL where appropriate.

Client-side routing

React Router represents game selection through the URL rather than maintaining a separate selectedGame state.

Incremental development

Features are added through separate branches and merged into main.

49. Current Architecture Summary

The current Game Release Database consists of three primary layers.

Presentation Layer

React 19 + Vite + React Router

Responsible for:

search input
game list
routing
release display
loading states
error states
user interaction
Application Layer

Node.js + Express

Responsible for:

HTTP routing
request parameters
CORS
SQL execution
response formatting
error handling
Data Layer

PostgreSQL

Responsible for:

games
platforms
regions
releases
primary keys
foreign keys
relational integrity
querying and ordering data

The overall architecture is:

┌──────────────────────────┐
│      React + Vite        │
│                          │
│ App / GameDetails        │
│ useState / useEffect     │
│ React Router / Fetch     │
└────────────┬─────────────┘
             │ HTTP
             ▼
┌──────────────────────────┐
│    Node.js + Express     │
│                          │
│ REST Routes              │
│ CORS                     │
│ Error Handling            │
│ pg Pool                  │
└────────────┬─────────────┘
             │ SQL
             ▼
┌──────────────────────────┐
│       PostgreSQL         │
│                          │
│ games                    │
│ releases                 │
│ platforms                │
│ regions                  │
│ PK / FK relationships    │
└──────────────────────────┘

This architecture provides a simple foundation for the current MVP while allowing additional functionality to be added later.