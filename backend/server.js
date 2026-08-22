const express = require("express");
const pool = require("./db");

const app = express();

app.get("/", (req, res) => {
    res.send("Game Release API is running!");
});

app.get("/games", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM games");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});