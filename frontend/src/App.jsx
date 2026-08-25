import { useEffect, useState } from "react";

function App() {
    const [games, setGames] = useState([]);

    useEffect(() => {
        fetch("http://localhost:3000/games")
            .then(response => response.json())
            .then(data => setGames(data));
    }, []);

    return (
        <div>
            <h1>Game Release Database</h1>

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