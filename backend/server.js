const cors = require("cors");
const express = require("express");
const pool = require("./db");

const app = express();
app.use(cors());

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

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});