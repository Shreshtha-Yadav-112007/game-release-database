import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

function GameDetails() {
  const { id } = useParams();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/games/${id}/releases`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch releases");
        }

        return data;
      })
      .then((data) => {
        setReleases(data);
      })
      .catch((error) => {
        console.error(error);
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div>
      <h2>Game ID: {id}</h2>

      <h3>Releases</h3>

      {loading && <p>Loading releases...</p>}
      
      {error && <p>Error: {error}</p>}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const url = search
      ? `http://localhost:3000/games?search=${encodeURIComponent(search)}`
      : "http://localhost:3000/games";

    fetch(url)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch games");
        }

        return data;
      })
      .then((data) => {
        setGames(data);
      })
      .catch((error) => {
        console.error(error);
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
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
              onChange={(event) => {
                setError(null);
                setLoading(true);
                setSearch(event.target.value);
              }}
            />

            {loading && <p>Loading games...</p>}

            {error && <p>Error: {error}</p>}

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
