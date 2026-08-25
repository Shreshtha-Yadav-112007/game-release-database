import { useEffect, useState } from "react";

function App() {
    const [games, setGames] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const url = search
            ? `http://localhost:3000/games?search=${encodeURIComponent(search)}`
            : "http://localhost:3000/games";

        fetch(url)
            .then(response => response.json())
            .then(data => setGames(data));
    }, [search]);

    return (
        <div>
            <h1>Game Release Database</h1>

            <input
                type="text"
                placeholder="Search for a game..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            <ul>
                {games.map(game => (
                    <li key={game.id}>
                        {game.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;