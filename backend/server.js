const express = require('express');

const app = express();

app.get("/",(req,res)=>{
    res.send("Game Release API is running");
});

app.get("/games",(req,res)=>{
    res.json([
        {
            id: 1,
            title: "Resident Evil 4",
        },
        {
            id: 2,
            title: "Sonic Adventure 2"
        }
    ]);
});

app.listen(3000, ()=>{
    console.log("Server is running on http://localhost:3000");
});