Minimum Viable Product (MVP):

The current MVP focuses on the core functionality required to search for games, view release information, manage supplementary game metadata, and generate an AI-based release summary.

1. Game Search:

Users can search for games by title.

- Search is case-insensitive.
- Partial title matches are supported.
- Games are returned alphabetically by title when no search term is supplied.

2. Game Release Details:

Users can select a game and view its release records.
Each release record can contain:

- Platform
- Region
- Release format
- Release date
- Release notes

Release data is retrieved from PostgreSQL through the backend API.

3. Game Metadata:

The backend supports storing supplementary metadata for each game in MongoDB.

Metadata includes:

- Title
- Developer
- Publisher
- Genres
- Aliases
- Notes
- Sources

Metadata can be created, retrieved, updated, and deleted through the metadata API.

4. AI Release Summary:

Users can request an AI-generated summary of a game's release history.

The backend:

1. Validates the game ID.
2. Retrieves the game's metadata from MongoDB.
3. Retrieves the game's release records from PostgreSQL.
4. Sends the supplied release data to the Google Gemini API.
5. Receives a structured summary.
6. Stores the generated summary back in MongoDB.
7. Returns the summary to the frontend.

The structured AI response contains:

- Summary
- Release count
- Platforms
- Regions
- Release formats
- Notable patterns

5. Current MVP Scope:

The current implementation provides the core search and release-viewing experience through the React frontend, with metadata management and AI-summary functionality exposed through the backend API.

Not Currently Implemented:

❌ Platform filters
❌ Region filters
❌ Release-format filters
❌ Create/edit/delete release records
❌ User accounts and authentication
❌ Collection tracking
❌ Wishlist
❌ Price tracking
❌ Community submissions
❌ Comments/reviews
❌ Dedicated mobile application
❌ Automated data collection
