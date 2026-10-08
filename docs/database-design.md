Game Release Database — Database Design
1. Database Architecture
The project uses a hybrid database design with PostgreSQL as the relational source for core game/release data and MongoDB for flexible game metadata and AI-generated summaries.
                         Game Release Database
                                  |
                 +----------------+----------------+
                 |                                 |
            PostgreSQL                         MongoDB
       Core relational data               Flexible metadata
                 |                                 |
      +----------+----------+                game_metadata
      |          |          |
    games    platforms    regions
      |
   releases
The relationship between PostgreSQL and MongoDB is maintained at the application level using gameId. MongoDB's gameId stores the corresponding PostgreSQL games.id. There is no cross-database foreign-key constraint.
2. PostgreSQL Database
PostgreSQL stores the structured data required to represent games and their regional/platform releases.
2.1 games
Column	Type	Constraints	Description
id	SERIAL	PRIMARY KEY	Unique game identifier
title	VARCHAR(255)	NOT NULL	Game title
description	TEXT	Nullable	Optional game description
cover_image	TEXT	Nullable	Optional cover-image URL/path


The primary key id is used by releases.game_id and is also referenced logically by MongoDB's game_metadata.gameId.
2.2 platforms
Column	Type	Constraints	Description
id	SERIAL	PRIMARY KEY	Unique platform identifier
name	VARCHAR(100)	NOT NULL	Platform name


2.3 regions
Column	Type	Constraints	Description
id	SERIAL	PRIMARY KEY	Unique region identifier
name	VARCHAR(100)	NOT NULL	Region name
code	VARCHAR(10)	NOT NULL	Region code such as NA, JP, PAL, or WW


2.4 releases
Column	Type	Constraints	Description
id	SERIAL	PRIMARY KEY	Unique release identifier
game_id	INTEGER	NOT NULL, FK → games.id	Game associated with the release
platform_id	INTEGER	NOT NULL, FK → platforms.id	Platform associated with the release
region_id	INTEGER	NOT NULL, FK → regions.id	Region associated with the release
release_format	VARCHAR(20)	NOT NULL	Release format, e.g. PHYSICAL
release_date	DATE	Nullable	Release date
notes	TEXT	Nullable	Additional release notes


PostgreSQL relationships
Games (1) --------< Releases >-------- (1) Platforms
                       |
                       |
                       +--------------> Regions
A single game can have multiple releases. Each release references exactly one platform and one region through foreign keys.
The backend retrieves release information with joins across games, platforms, regions, and releases.
3. MongoDB Database
MongoDB stores metadata that is more flexible than the core relational release structure and also stores generated AI summaries.
Database
Database: game_release_database
Collection: game_metadata
3.1 game_metadata document
A document has the following structure:
{
  gameId: Number,
  title: String,
  developer: String,
  publisher: String,
  genres: [String],
  aliases: [String],
  notes: [String],
  sources: [
    {
      name: String,
      url: String,
      note: String
    }
  ],
  aiSummary: {
    summary: String,
    releaseCount: Number,
    platforms: [String],
    regions: [String],
    releaseFormats: [String],
    notablePatterns: [String]
  },
  updatedAt: Date
}
Required metadata fields
The MongoDB validator requires:
- gameId
- title
- developer
- publisher
- genres
- aliases
- notes
- sources
- updatedAt
aiSummary is optional, because a metadata document can exist before an AI release summary has been generated.
sources subdocument
Each source object requires:
Field	Type	Required	Description
name	String	Yes	Source name
url	String	Yes	Source URL
note	String	Yes	Note describing the source


aiSummary subdocument
When present, the AI summary must contain all six structured fields:
Field	Type	Description
summary	String	Overall release summary
releaseCount	Number	Number of releases considered
platforms	Array<String>	Platforms represented in the releases
regions	Array<String>	Regions represented in the releases
releaseFormats	Array<String>	Release formats represented
notablePatterns	Array<String>	Patterns identified from the provided release data


MongoDB validation
The application creates or updates the game_metadata collection with:
validationLevel: "strict"
validationAction: "error"
This means documents that do not satisfy the defined JSON Schema are rejected.
A unique index is also created on gameId:
{ gameId: 1 }, { unique: true }
This enforces a maximum of one metadata document per PostgreSQL game ID.
4. Cross-Database Relationship
The two databases are connected logically through the game identifier:
PostgreSQL                         MongoDB
-----------                        -------
games.id  <--------------------->  game_metadata.gameId
For example:
PostgreSQL games
id = 1
 title = "Resident Evil 4"

MongoDB game_metadata
{
  gameId: 1,
  title: "Resident Evil 4",
  ...
}
This is not a MongoDB foreign key or a PostgreSQL foreign key. The Express backend uses the shared identifier to coordinate data across the two databases.
5. Data Access Patterns
Game listing/search
The GET /games endpoint reads from PostgreSQL's games table.
With a search term, the backend uses a parameterized ILIKE query for case-insensitive partial title matching and sorts the results alphabetically by title.
Release lookup
The GET /games/:id/releases endpoint reads release data from PostgreSQL and joins:
releases
   ↓ game_id
 games

releases
   ↓ platform_id
 platforms

releases
   ↓ region_id
 regions
Results are ordered by release_date ascending.
Metadata CRUD
Metadata operations use the MongoDB game_metadata collection:
POST   /games/:id/metadata
GET    /games/:id/metadata
PUT    /games/:id/metadata
DELETE /games/:id/metadata
The backend validates the route ID as an integer before performing these operations.
AI release summary
POST /games/:id/ai-summary combines both databases:
1. Read game metadata from MongoDB
2. Read releases from PostgreSQL
3. Build a release-summary prompt
4. Generate a structured summary with Google Gemini
5. Store the resulting aiSummary back in MongoDB
6. Return the structured result to the client
The AI summary is therefore derived from release data stored in PostgreSQL and persisted alongside the corresponding game's metadata in MongoDB.
6. Referential Integrity and Validation
PostgreSQL
Referential integrity is enforced through foreign keys:
releases.game_id      → games.id
releases.platform_id  → platforms.id
releases.region_id    → regions.id
The database also enforces NOT NULL constraints on the core identifying fields of releases, platforms, regions, and the game title.
MongoDB
Referential integrity with PostgreSQL is not enforced by the database engine. Instead:
- gameId is required by the MongoDB validator.
- gameId has a unique MongoDB index.
- The Express application coordinates PostgreSQL and MongoDB operations.
- MongoDB validates document structure and field types using $jsonSchema.
7. Seed Data
The PostgreSQL seed currently includes:
Platforms
- Gamecube
- Playstation 2
- PC
- Wii
- Dreamcast
- Playstation 3
- Xbox 360
Regions
- North America (NA)
- Japan (JP)
- PAL (PAL)
- Worldwide (WW)
Games
- Resident Evil 4
- Sonic Adventure 2
Releases
- Resident Evil 4 — Gamecube — North America — PHYSICAL — 2005-01-11
- Resident Evil 4 — Gamecube — Japan — PHYSICAL — 2005-01-27
- Sonic Adventure 2 — Dreamcast — North America — PHYSICAL — 2001-06-19
The seed file also contains a JOIN query demonstrating how release information is retrieved with game, platform, and region names.
8. Design Rationale
Why PostgreSQL for core release data?
The release domain has clear relationships between games, platforms, regions, and releases. PostgreSQL provides relational integrity through primary and foreign keys and makes multi-table JOIN queries straightforward.
Why MongoDB for metadata?
Game metadata contains arrays and nested source objects and may evolve independently from the fixed release schema. MongoDB provides a flexible document structure while the application's JSON Schema validator still enforces the required shape.
Why store the AI summary in MongoDB?
The generated summary is associated with a game's metadata and is updated independently of the normalized release records. Persisting it in the metadata document also avoids regenerating the summary unless the endpoint is called again.
Why use a shared gameId?
A shared identifier provides a simple application-level link between the relational game record and its corresponding MongoDB metadata document without introducing direct cross-database coupling.
9. Current Limitations
The database design currently has the following limitations:
- PostgreSQL does not define explicit indexes beyond the primary keys.
- release_format is stored as VARCHAR(20) without a database-level CHECK constraint or enum.
- platform.name and region.code are not unique at the PostgreSQL schema level.
- The PostgreSQL releases endpoint currently passes the route ID as a parameter without the same explicit integer validation used by the metadata and AI-summary routes.
- The PostgreSQL and MongoDB game relationship is logical rather than enforced by a cross-database constraint.
- The current schema does not include automatic cascade rules on the foreign keys.
These are current implementation characteristics rather than missing assumptions; they should be considered when extending the system.
10. Source of Truth
The database implementation described here is based on the current repository files:
- database/schema.sql
- database/seed.sql
- backend/mongo.js
- backend/db.js
- backend/server.js
This document should be updated whenever the database schema, MongoDB validation rules, or data-access behavior changes.