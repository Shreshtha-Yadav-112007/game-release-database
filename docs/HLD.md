Game Release Database — High-Level Design

1. System Overview:

The Game Release Database is a full-stack web application that allows users to search for video games and view their release information across different platforms, regions, and release formats.

The system is divided into three primary layers:

- Frontend
- Backend
- Database

The frontend provides the user interface and handles user interactions.

The backend provides a REST API that processes requests from the frontend and communicates with the database.

The database stores the game's release information and maintains the relationships between games, releases, platforms, and regions.

2. System Architecture:

The system follows a simple client-server architecture.

The React frontend acts as the client.

The Node.js and Express backend acts as the application server.

PostgreSQL acts as the persistent data storage layer.

The overall communication flow is:

1.The user interacts with the React frontend.
2. The frontend sends an HTTP request to the Express backend.
3. The backend processes the request.
4. The backend communicates with PostgreSQL when data is required.
5. PostgreSQL returns the requested information.
6. The backend sends the data back to the frontend.
7. The frontend displays the result to the user.

This architecture keeps the user interface, application logic, and data storage separated from one another.

3. Frontend Layer:

Technology:

- React
- Vite
- JavaScript
- Fetch API
- Responsibilities

The frontend is responsible for:

- Providing the user interface.
- Accepting game search input.
- Displaying available games.
- Displaying search results.
- Allowing users to select a game.
- Requesting release information.
- Displaying release information.

The frontend does not directly communicate with PostgreSQL.

All database-related operations are performed through the backend API.

4. Backend Layer:

Technology:

- Node.js
- Express
- JavaScript
- PostgreSQL client
- CORS middleware

Responsibilities:

The backend acts as the intermediary between the frontend and database.

Its responsibilities include:

- Receiving API requests from the frontend.
- Processing request parameters.
- Performing database queries.
- Retrieving game information.
- Retrieving release information.
- Returning data as JSON.
- Handling database errors.
- Managing cross-origin requests during development.

The backend exposes REST API endpoints that the frontend can use to retrieve information.

5. Database Layer:

Technology:

PostgreSQL

Responsibilities:

The database is responsible for persistent storage of the application's data.

The current database stores:

- Games
- Releases
- Platforms
- Regions

The database also maintains the relationships between these entities.

A game can have multiple releases, while each release is associated with a particular platform and region.

This structure allows the system to represent multiple releases of the same game without duplicating the game's basic information.

6. API Layer:

The backend exposes a REST-style API for communication between the frontend and backend.

Current Endpoints:

Get Games:

GET /games

Returns the available games.

Search Games:

GET /games?search={searchTerm}

Returns games matching the provided search term.

Get Game Releases:

GET /games/:id/releases

Returns the releases associated with a specific game.

The API acts as the boundary between the frontend and backend.

This means the frontend does not need to know how the database is structured internally.

7. Data Flow:

Game Search:

When a user searches for a game:

1. The user enters a search term in the frontend.
2. React sends a request to the games API.
3. Express receives the request.
4. The backend queries PostgreSQL.
5. PostgreSQL returns matching games.
6. Express returns the results as JSON.
7. React updates the game list.

Viewing Releases:

When a user selects a game:

1. The user selects a game from the results.
2. React sends a request containing the game's ID.
3. Express receives the request.
4. The backend queries PostgreSQL for the game's releases.
5. PostgreSQL returns the release information.
6. Express returns the releases as JSON.
7. React displays the release information.

8. Component Responsibilities:

Frontend:

The frontend handles presentation and user interaction.

It is responsible for:

- Search input
- Game listing
- Game selection
- Release display
- Managing frontend state

Backend:

The backend handles application-level communication.

It is responsible for:

- API routing
- Request handling
- Database communication
- Query execution
- Response formatting
- Error handling

Database:

The database handles persistent application data.

It is responsible for:

- Data storage
- Relationships between entities
- Data retrieval
- Maintaining data consistency

9. Database Architecture:

The database is structured around the concept of a game having multiple releases.

The primary relationship is between games and releases.

A single game can have many releases.

Each release is associated with:

- One game
- One platform
- One region
- One release format
- One release date

This allows the system to represent situations where the same game was released on multiple platforms and in multiple regions.

For example, a single game may have separate records for:

- GameCube — Japan — Physical
- GameCube — North America — Physical
- PlayStation 2 — North America — Physical
- PC — Europe — Digital

The detailed database structure is documented separately in the LLD.

10. Communication Between Layers:

The frontend and backend communicate through HTTP requests.

The backend and database communicate through SQL queries.

The frontend does not have direct access to the database.

This separation provides several benefits:

- Database credentials remain on the backend.
- Database implementation details are hidden from the frontend.
- The backend can validate and process requests before accessing the database.
- The frontend can be changed without redesigning the database.
- The database can be changed without requiring direct frontend access.

11. Development Environment:

During development, the application runs as separate frontend and backend processes.

The frontend is served through the Vite development server.

The backend runs through the Node.js and Express server.

The PostgreSQL database runs separately and is accessed by the backend.

The current development environment therefore consists of:

- React/Vite development server
- Node.js/Express API server
- PostgreSQL database

CORS is configured on the backend to allow communication between the frontend and backend during local development.

12. Security Architecture:

The frontend does not directly connect to PostgreSQL.

Database communication is restricted to the backend.

User-provided search values are passed to the database using parameterized queries.

This helps protect the database from SQL injection.

Additional security mechanisms such as authentication, authorization, rate limiting, HTTPS configuration, and production security policies are not currently required for the MVP.

13. Scalability Considerations:

The current architecture is intentionally simple because the project is currently focused on the MVP.

The architecture provides opportunities for future improvements if the dataset or user base grows.

Potential improvements include:

- Database indexes for frequently searched fields.
- Pagination for large result sets.
- Improved search functionality.
- Caching frequently requested data.
- Separating frontend components into smaller modules.
- Adding additional backend service layers.
- Deploying the frontend and backend separately.
- Database optimization for larger datasets.

These improvements are not currently required for the MVP.

14. Current System Limitations:

The current system has several limitations:

- The application currently runs in a local development environment.
- The frontend has a relatively simple user interface.
- Search functionality is limited to game titles.
- Advanced filtering is not currently available.
- Detailed game relationships are not currently implemented.
- There are no user accounts or authentication.
- There is no user collection functionality.
- Release data is currently maintained manually.
- Loading and error states on the frontend are limited.

These limitations can be addressed in future iterations.

15. Future Architecture:

The current architecture is designed to provide a foundation for future features.

Potential future additions include:

- Advanced game search and filtering.
- Game detail pages.
- Relationships between original games, remakes, and remasters.
- User accounts.
- User game collections.
- Community contributions.
- Release source tracking.
- Automated data ingestion.
- Production deployment.
- Improved database indexing and optimization.

These features can be added without fundamentally changing the three-layer architecture of the application.

16. Design Principles:

The current system follows several basic design principles:

Separation of Concerns:

The frontend, backend, and database have separate responsibilities.

Simplicity:

The architecture is intentionally kept simple for the MVP rather than introducing unnecessary technologies or services.

Maintainability:

The system is separated into distinct layers so that individual parts can be modified without requiring changes throughout the entire application.

Extensibility:

The database and API are structured so that additional functionality can be added as the project develops.

17. Architecture Summary:

The current Game Release Database uses a three-layer architecture consisting of:

Presentation Layer:

React and Vite provide the user interface and handle user interactions.

Application Layer:

Node.js and Express provide the REST API and handle communication between the frontend and database.

Data Layer:

PostgreSQL stores games, releases, platforms, regions, and their relationships.

The architecture provides a simple foundation for the MVP while leaving room for future features such as advanced filtering, game relationships, user collections, and larger-scale data management.