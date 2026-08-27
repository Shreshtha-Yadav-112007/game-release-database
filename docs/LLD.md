***Game Release Database — Low-Level Design***

**1. Overview:**

The Game Release Database is a full-stack web application that allows users to search for video games and view their release information across different platforms, regions, and release formats.

Technology Stack:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Communication: HTTP/REST API
- Database Access: PostgreSQL client

Current User Flow:

1. The user searches for a game.
2. The frontend sends the search request to the backend.
3. The backend queries the PostgreSQL database.
4. Matching games are returned to the frontend.
5. The user selects a game.
6. The frontend requests the selected game's releases.
7. The backend retrieves the releases from PostgreSQL.
8. The release information is displayed to the user.

**2. Project Structure:**

The project is separated into frontend, backend, database, and documentation areas.

Frontend:

Contains the React application, including the main application component, styling, and Vite configuration.

Backend:

Contains the Node.js and Express application responsible for handling API requests and communicating with PostgreSQL.

Database:

Contains the SQL and database-related files used to create and populate the database.

Documentation:

Contains project documentation such as the PRD, HLD, and LLD.

README:

Contains general information about the project and instructions for setting up and running it.

**3. Database Design:**

The database stores games and their associated release information.

*Main Entities:*

The current database contains the following main entities:

- Game
- Release
- Platform
- Region

Game:

Represents a distinct video game.

Examples include:

- Resident Evil 4
- Sonic Adventure 2

Release:

Represents a specific release of a game for a particular platform, region, and release format.

A single game can have multiple release records.

Platform:

Represents a gaming platform.

Examples include:

- GameCube
- PlayStation 2
- Dreamcast
- PC

Region:

Represents the geographical market associated with a release.

Examples include:

- North America
- Japan
- Europe

**4. Database Relationships:**

The current database relationships are:

- One game can have many releases.
- One platform can have many releases.
- One region can have many releases.
- Each release belongs to one game.
- Each release belongs to one platform.
- Each release belongs to one region.

This structure allows multiple releases of the same game to be stored without duplicating the game's basic information.

For example, a game can have separate release records for different platforms and regions.

**5. Release Data Model:**

Each release contains information describing how and where the game was released.

The current release information consists of:

- Game
- Platform
- Region
- Release format
- Release date
- Optional notes

The release format identifies whether the release is physical or digital.

**6. Backend Architecture:**

The backend uses Node.js and Express to provide REST API endpoints.

The backend is responsible for:

- Receiving HTTP requests.
- Reading request parameters.
- Executing SQL queries.
- Retrieving data from PostgreSQL.
- Returning JSON responses.
- Handling database errors.
- Allowing requests from the frontend through CORS.

Request Processing:

When an API request is received:

1. Express receives the request.
2. The appropriate route processes the request.
3. Request parameters are obtained.
4. A SQL query is executed against PostgreSQL.
5. PostgreSQL returns the requested data.
6. The backend sends the result to the frontend as JSON.

**7. API Endpoints:**

*7.1 Get All Games:*

Endpoint: GET /games

Returns the games currently stored in the database.

When no search term is provided, the frontend uses this endpoint to retrieve the available games.

*7.2 Search Games:*

Endpoint: GET /games?search={searchTerm}

Returns games whose titles match the provided search term.

The backend performs a case-insensitive search using PostgreSQL's ILIKE operator.

The search supports partial title matching.

For example, searching for resident can return Resident Evil 4.

Parameterized queries are used to safely pass the search value to PostgreSQL.

*7.3 Get Game Releases:*

Endpoint: GET /games/:id/releases

Returns release information associated with a specific game.

The game ID is obtained from the URL parameter.

The backend uses the game ID to retrieve the corresponding releases from the database.

The returned information includes:

- Platform
- Region
- Release format
- Release date
- Notes, where applicable

**8. Frontend Architecture:**

The frontend is built using React and Vite.

The main application logic is currently implemented in App.jsx.

The frontend is responsible for:

- Displaying the user interface.
- Accepting search input.
- Requesting game data from the backend.
- Displaying search results.
- Allowing users to select a game.
- Requesting release information.
- Displaying release information.

The frontend does not communicate directly with PostgreSQL.

All database operations are performed through the backend API.

**9. React State Management:**

The application currently uses four main pieces of React state.

Games:

Stores the list of games returned by the backend.

Selected Game:

Stores the game currently selected by the user.

The initial value is null because no game is selected when the application first loads.

Releases:

Stores the release information returned for the currently selected game.

Search:

Stores the search input entered by the user.

**10. Frontend API Communication:**

The frontend communicates with the backend using the browser's fetch API.

When the user enters a search term, the frontend sends a request to the games endpoint with the search term included as a query parameter.

The search term is encoded using encodeURIComponent before being included in the request URL.

When the search field is empty, the frontend requests all available games.

The returned JSON data is stored in React state and used to update the displayed game list.

**11. React Effects:**

The application currently uses two useEffect hooks.

Game Search Effect:

The first effect runs whenever the search value changes.

It requests the appropriate games endpoint and stores the returned games in the games state.

If the search field is empty, all available games are retrieved.

Release Retrieval Effect:

The second effect runs whenever the selected game changes.

When a game is selected, the frontend requests the releases endpoint using the selected game's ID.

The returned releases are stored in the releases state.

If no game has been selected, the release request is not made.

**12. Game Selection:**

Games returned from the API are displayed as a list.

When a user clicks a game, that game is stored as the selected game.

Changing the selected game triggers the release retrieval effect, which requests the corresponding release information from the backend.

This connects the game search functionality with the release information functionality.

**13. Release Display:**

When a game has been selected, its release information is displayed below the game list.

The current release display includes:

- Platform
- Region
- Release format
- Release date

The release date is formatted so that the relevant date portion is displayed instead of the complete serialized timestamp.

**14. CORS:**

During development, the frontend and backend run on different local origins.

The frontend runs on localhost:5173.

The backend runs on localhost:3000.

The backend uses CORS middleware to allow the frontend to make requests to the API during development.

Production CORS configuration will be addressed when the application is deployed.

**15. Error Handling:**

The backend handles database query failures by returning an HTTP 500 response.

The frontend currently focuses primarily on the successful data flow.

More detailed loading, validation, and error states can be added in future iterations.

**16. Security Considerations:**

The current implementation uses parameterized SQL queries for user-provided search terms and game IDs.

This prevents user input from being directly inserted into SQL statements and helps protect the application against SQL injection.

Authentication, authorization, rate limiting, and additional production security configuration are outside the scope of the current MVP.

**17. Current Limitations**

The current implementation does not include:

- User accounts
- Authentication
- Advanced filtering
- Game relationship management
- Remake and remaster relationships
- User collections
- Price tracking
- Community contributions
- Automated data ingestion
- Production deployment
- Comprehensive frontend loading and error states
- Large-scale dataset optimization

These features may be considered in future iterations.

**18. Future Technical Improvements:**

Potential future technical improvements include:

- Splitting the React application into reusable components.
- Adding React Router for dedicated game detail views.
- Adding advanced search and filtering.
- Adding game relationship models.
- Adding source and reference tracking for release data.
- Improving API validation.
- Improving frontend loading and error states.
- Adding database indexes for larger datasets.
- Adding pagination.
- Deploying the application to a production environment.

**19. Current Architecture Summary:**

The application consists of three primary components:

Frontend:

React and Vite handle the user interface, search input, game selection, and display of game and release information.

Backend:

Node.js and Express handle API requests, application logic, database queries, and communication with the frontend.

Database:

PostgreSQL stores games, releases, platforms, regions, and their relationships.

The frontend communicates with the backend through REST API requests, while the backend communicates with PostgreSQL through SQL queries.

This separation keeps presentation, application logic, and persistent data storage independent from one another while providing a foundation for future development.