const cors = require("cors");
const express = require("express");
const pool = require("./db");
const connectMongoDB = require("./mongo");

const app = express();

let mongoDb;

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Game Release API is running!");
});

app.get("/games", async (req, res) => {
    try {
        const { search } = req.query;

        let result;

        if (search) {
            result = await pool.query(
                `
                SELECT *
                FROM games
                WHERE title ILIKE $1
                ORDER BY title ASC;
                `,
                [`%${search}%`] //This is called a parameterized query, which helps prevent SQL injection attacks by safely inserting the search term into the query.
            );
        } else {
            result = await pool.query(
                `
                SELECT *
                FROM games
                ORDER BY title ASC;
                `
            );
        }

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});

app.get("/games/:id/releases", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
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
            `,
            [id] //Again, parameterized query to safely insert the game ID into the query.
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});

app.post("/games/:id/metadata", async (req, res) => {
    try {
        const gameId = Number(req.params.id);

        if (!Number.isInteger(gameId)) {
            return res.status(400).json({ error: "Invalid game ID" });
        }

        const {
            title,
            developer,
            publisher,
            genres,
            aliases,
            notes,
            sources
        } = req.body;

        const metadata = {
            gameId,
            title,
            developer,
            publisher,
            genres,
            aliases,
            notes,
            sources,
            updatedAt: new Date()
        };

        const result = await mongoDb
            .collection("game_metadata")
            .insertOne(metadata);

        res.status(201).json({
            message: "Game metadata created",
            id: result.insertedId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                error: "Metadata already exists for this game"
            });
        }

        res.status(400).json({
            error: "Failed to create game metadata"
        });
    }
});

app.get("/games/:id/metadata", async (req, res) => {
    try {
        const gameId = Number(req.params.id);

        if (!Number.isInteger(gameId)) {
            return res.status(400).json({ error: "Invalid game ID" });
        }

        const metadata = await mongoDb
            .collection("game_metadata")
            .findOne({ gameId });

        if (!metadata) {
            return res.status(404).json({
                error: "Game metadata not found"
            });
        }

        res.status(200).json(metadata);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch game metadata"
        });
    }
});

app.put("/games/:id/metadata", async (req, res) => {
    try {
        const gameId = Number(req.params.id);

        if (!Number.isInteger(gameId)) {
            return res.status(400).json({ error: "Invalid game ID" });
        }

        const {
            title,
            developer,
            publisher,
            genres,
            aliases,
            notes,
            sources
        } = req.body;

        const result = await mongoDb
            .collection("game_metadata")
            .updateOne(
                { gameId },
                {
                    $set: {
                        title,
                        developer,
                        publisher,
                        genres,
                        aliases,
                        notes,
                        sources,
                        updatedAt: new Date()
                    }
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                error: "Game metadata not found"
            });
        }

        res.status(200).json({
            message: "Game metadata updated"
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            error: "Failed to update game metadata"
        });
    }
});

app.delete("/games/:id/metadata", async (req, res) => {
    try {
        const gameId = Number(req.params.id);

        if (!Number.isInteger(gameId)) {
            return res.status(400).json({ error: "Invalid game ID" });
        }

        const result = await mongoDb
            .collection("game_metadata")
            .deleteOne({ gameId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: "Game metadata not found"
            });
        }

        res.status(200).json({
            message: "Game metadata deleted"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete game metadata"
        });
    }
});

async function startServer() {
    try {
        mongoDb = await connectMongoDB();

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();