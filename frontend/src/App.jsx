import { useEffect, useState } from "react";

function App() {
    const [games, setGames] = useState([]); // State to hold the list of games fetched from the backend
    const [selectedGame, setSelectedGame] = useState(null); // State to hold the currently selected game
    const [releases, setReleases] = useState([]); // State to hold the list of releases for the selected game
    const [search, setSearch] = useState(""); // State to hold the search term entered by the user

    useEffect(() => { // Fetch games from the backend whenever the search term changes
        const url = search
            ? `http://localhost:3000/games?search=${encodeURIComponent(search)}`
            : "http://localhost:3000/games";

        fetch(url)
            .then(response => response.json())
            .then(data => setGames(data));
    }, [search]);

    useEffect(() => { 
    if (!selectedGame) {
        return;
    }

    fetch(`http://localhost:3000/games/${selectedGame.id}/releases`) // Fetch releases for the selected game whenever it changes
        .then(response => response.json())
        .then(data => setReleases(data));
}, [selectedGame]);

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
                    <li
                        key={game.id}
                        onClick={() => setSelectedGame(game)}
                    >
                        {game.title}
                    </li>
                ))}
            </ul>
            
            {selectedGame && (
                <div>
                    <h2>{selectedGame.title}</h2>
                    <h3>Releases</h3>
                    <ul>
                        {releases.map(release => (
                            <li key={release.id}>
                                {release.platform} - {release.region} - {release.release_format} - {release.release_date.slice(0, 10)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;