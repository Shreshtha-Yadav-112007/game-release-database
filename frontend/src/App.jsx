import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

function GameDetails() {
  const { id } = useParams();
  const [releases, setReleases] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/games/${id}/releases`)
      .then((response) => response.json())
      .then((data) => setReleases(data));
  }, [id]);

  return (
    <div>
      <h2>Game ID: {id}</h2>

      <h3>Releases</h3>

      <ul>
        {releases.map((release) => (
          <li key={release.id}>
            {release.platform} - {release.region} - {release.release_format} -{" "}
            {release.release_date.slice(0, 10)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [games, setGames] = useState([]); // State to hold the list of games fetched from the backend
  const [search, setSearch] = useState(""); // State to hold the search term entered by the user
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch games from the backend whenever the search term changes
    const url = search
      ? `http://localhost:3000/games?search=${encodeURIComponent(search)}`
      : "http://localhost:3000/games";

    fetch(url)
      .then((response) => response.json())
      .then((data) => setGames(data));
  }, [search]);

  return (
    <Routes>
      <Route
        path="/games"
        element={
          <div>
            <h1>Game Release Database</h1>

            <input
              type="text"
              placeholder="Search for a game..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <ul>
              {games.map((game) => (
                <li
                  key={game.id}
                  onClick={() => {
                    navigate(`/games/${game.id}`); // Navigate to the game details page when a game is clicked
                  }}
                >
                  {game.title}
                </li>
              ))}
            </ul>
          </div>
        }
      />
      <Route path="/games/:id" element={<GameDetails />} />
    </Routes>
  );
}

export default App;
