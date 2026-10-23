import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ReleaseCover({ src, title }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return (
      <div
        className="release-cover-placeholder"
        role="img"
        aria-label={`${title} cover art unavailable`}
      >
        <span>Cover</span>
        <small>Not added</small>
      </div>
    );
  }

  return (
    <img
      className="release-cover-image"
      src={src}
      alt={`${title} cover art`}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aiSummary, setAiSummary] = useState(null); //Stores Gemini's structured response
  const [aiLoading, setAiLoading] = useState(false); //Tells the UI that Gemini is generating
  const [aiError, setAiError] = useState(null); //Stores an AI request error

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/games/${id}/releases`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch releases");
        }

        return data;
      })
      .then((data) => {
        if (!cancelled) {
          setReleases(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch(`${API_URL}/games/${id}/ai-summary`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI summary");
      }

      setAiSummary(data.summary);
    } catch (error) {
      console.error(error);
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="app-shell detail-page">
      <header className="site-header">
        <button
          type="button"
          className="brand"
          onClick={() => navigate("/games")}
          aria-label="Return to Game Release Database"
        >
          <span className="brand-copy">
            <span className="brand-name">Game Release Database</span>
            <span className="brand-subtitle">A VIDEO GAME RELEASE ARCHIVE</span>
          </span>
        </button>

        <button
          type="button"
          className="back-link header-back-link"
          onClick={() => navigate("/games")}
        >
          ← All games
        </button>
      </header>

      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate("/games")}>
          Catalogue
        </button>
        <span aria-hidden="true">/</span>
        <span>Game record #{String(id).padStart(3, "0")}</span>
      </nav>

      <section className="detail-heading">
        <div className="detail-title-copy">
          <p className="eyebrow">GAME RELEASE HISTORY</p>

          <h1>{releases[0]?.title || `Game #${id}`}</h1>

          <p className="detail-description">
            Explore documented releases across platforms, regions, and formats.
          </p>
        </div>

        {!loading && !error && (
          <div className="release-count">
            <strong>{releases.length}</strong>
            <span>
              {releases.length === 1 ? "release record" : "release records"}
            </span>
          </div>
        )}
      </section>

      <section className="detail-ai-section" aria-labelledby="ai-heading">
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-intro">
              <p className="eyebrow ai-eyebrow">AI-ASSISTED ANALYSIS</p>
              <h2 id="ai-heading">Release overview</h2>
              <p>
                A summary of the release data, generated from the records
                available for this game.
              </p>
            </div>

            <button
              type="button"
              className="primary-action"
              onClick={generateAISummary}
              disabled={aiLoading || loading || Boolean(error)}
            >
              {aiLoading
                ? "Generating summary…"
                : aiSummary
                  ? "Regenerate summary"
                  : "Generate summary"}
            </button>
          </div>

          {aiLoading && (
            <div className="ai-status" role="status">
              <span className="loading-spinner" />
              <p>Analysing release records…</p>
            </div>
          )}

          {aiError && (
            <div className="detail-error" role="alert">
              <strong>Couldn't generate the summary.</strong>
              <p>{aiError}</p>
            </div>
          )}

          {aiSummary && (
            <div className="ai-summary-content">
              <p className="ai-summary-text">{aiSummary.summary}</p>

              <div className="ai-facts-grid">
                <div className="ai-fact">
                  <span>Total releases</span>
                  <strong>{aiSummary.releaseCount}</strong>
                </div>

                <div className="ai-fact">
                  <span>Platforms</span>
                  <strong>{aiSummary.platforms.join(", ") || "—"}</strong>
                </div>

                <div className="ai-fact">
                  <span>Regions</span>
                  <strong>{aiSummary.regions.join(", ") || "—"}</strong>
                </div>

                <div className="ai-fact">
                  <span>Formats</span>
                  <strong>{aiSummary.releaseFormats.join(", ") || "—"}</strong>
                </div>
              </div>

              {aiSummary.notablePatterns.length > 0 && (
                <div className="ai-patterns">
                  <h3>Notable patterns</h3>
                  <ul>
                    {aiSummary.notablePatterns.map((pattern, index) => (
                      <li key={`${index}-${pattern}`}>{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="ai-disclaimer">
                AI-generated overview based on the supplied release records.
                Verify individual details against their original sources.
              </p>
            </div>
          )}

          {!aiSummary && !aiLoading && !aiError && (
            <p className="ai-placeholder">
              Generate an overview to explore release counts, regional
              availability, formats, and patterns in the available data.
            </p>
          )}
        </div>
      </section>

      <section className="release-section" aria-labelledby="releases-heading">
        <div className="release-section-heading">
          <div>
            <p className="eyebrow">THE RECORDS</p>
            <h2 id="releases-heading">Documented releases</h2>
            <p className="section-description">
              Each row represents a release for a particular platform and
              region.
            </p>
          </div>
        </div>

        {loading && (
          <div className="status-panel" role="status">
            <span className="loading-spinner" />
            <div>
              <strong>Loading release records</strong>
              <p>Retrieving the available data…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="status-panel status-error" role="alert">
            <span className="status-icon">!</span>
            <div className="status-copy">
              <strong>Unable to load release records</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && releases.length === 0 && (
          <div className="status-panel empty-state">
            <div>
              <strong>No release records found</strong>
              <p>There are currently no documented releases for this game.</p>
            </div>
          </div>
        )}

        {!loading && !error && releases.length > 0 && (
          <div className="release-table-wrap">
            <table className="release-table">
              <thead>
                <tr>
                  <th scope="col">Cover</th>
                  <th scope="col">Platform</th>
                  <th scope="col">Region</th>
                  <th scope="col">Format</th>
                  <th scope="col">Release date</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>

              <tbody>
                {releases.map((release) => (
                  <tr key={release.id}>
                    <td className="release-cover-cell">
                      <ReleaseCover
                        key={`${release.id}-${release.cover_image || "missing"}`}
                        src={release.cover_image}
                        title={`${release.title} — ${release.region}`}
                      />
                    </td>

                    <td className="release-platform">{release.platform}</td>

                    <td>{release.region}</td>

                    <td>
                      <span
                        className={`format-tag format-${(
                          release.release_format || "unknown"
                        ).toLowerCase()}`}
                      >
                        {(release.release_format || "Unknown").toLowerCase()}
                      </span>
                    </td>

                    <td className="release-date">
                      {release.release_date
                        ? new Date(release.release_date).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "UTC",
                            },
                          )
                        : "Unknown"}
                    </td>

                    <td className="release-notes">{release.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>GAME RELEASE DATABASE</span>
        <button type="button" onClick={() => navigate("/games")}>
          Back to catalogue ↑
        </button>
      </footer>
    </main>
  );
}

function GameDetailsRoute() {
  const { id } = useParams();

  return <GameDetails key={id} />;
}

function App() {
  const [games, setGames] = useState([]); // State to hold the list of games fetched from the backend
  const [search, setSearch] = useState(""); // State to hold the search term entered by the user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const url = search
      ? `${API_URL}/games?search=${encodeURIComponent(search)}`
      : `${API_URL}/games`;

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
  }, [search, retryCount]);

  return (
    <Routes>
      <Route
        path="/games"
        element={
          <main className="app-shell">
            <header className="site-header">
              <button
                type="button"
                className="brand"
                onClick={() => navigate("/games")}
                aria-label="Game Release Database home"
              >
                <span className="brand-copy">
                  <span className="brand-name">Game Release Database</span>
                  <span className="brand-subtitle">
                    A VIDEO GAME RELEASE ARCHIVE
                  </span>
                </span>
              </button>
            </header>

            <section className="catalog-intro">
              <p className="eyebrow">GAME CATALOGUE</p>

              <h1>Browse game releases.</h1>

              <p className="catalog-intro-description">
                Search a title to explore its documented releases across
                platforms, regions, formats, and dates.
              </p>
            </section>

            <section className="catalog-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE COLLECTION</p>
                  <h2>Games</h2>
                  <p className="section-description">
                    Select a title to inspect its release records.
                  </p>
                </div>

                <span className="result-count">
                  {loading
                    ? "Loading catalogue…"
                    : error
                      ? "Catalogue unavailable"
                      : `${games.length} ${
                          games.length === 1 ? "game" : "games"
                        } found`}
                </span>
              </div>

              <label className="search-box">
                <svg
                  className="search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.8"
                    cy="10.8"
                    r="6.8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="m16 16 4.2 4.2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  type="search"
                  aria-label="Search games by title"
                  placeholder="Search games by title..."
                  value={search}
                  onChange={(event) => {
                    setError(null);
                    setLoading(true);
                    setSearch(event.target.value);
                  }}
                  autoComplete="off"
                />

                {search && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setSearch("");
                    }}
                  >
                    Clear
                  </button>
                )}
              </label>

              {loading && (
                <div className="status-panel" role="status">
                  <span className="loading-spinner" />
                  <div>
                    <strong>Loading the catalogue</strong>
                    <p>Retrieving available game records…</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="status-panel status-error" role="alert">
                  <span className="status-icon">!</span>
                  <div className="status-copy">
                    <strong>Unable to load games</strong>
                    <p>{error}</p>
                  </div>
                  <button
                    type="button"
                    className="retry-button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setRetryCount((count) => count + 1);
                    }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && games.length === 0 && (
                <div className="status-panel empty-state">
                  <span className="status-icon">⌕</span>
                  <div>
                    <strong>No games found</strong>
                    <p>
                      {search
                        ? `We couldn't find a game matching "${search}". Try another title.`
                        : "There are no games in the catalogue yet."}
                    </p>
                  </div>
                  {search && (
                    <button
                      type="button"
                      className="retry-button"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && games.length > 0 && (
                <div className="game-list" aria-label="Game catalogue">
                  {games.map((game) => (
                    <button
                      type="button"
                      className="game-row"
                      key={game.id}
                      onClick={() => navigate(`/games/${game.id}`)}
                      aria-label={`View releases for ${game.title}`}
                    >
                      <span className="game-row-number">
                        {String(game.id).padStart(3, "0")}
                      </span>

                      <span className="game-row-main">
                        <span className="game-row-title">{game.title}</span>

                        {game.description && (
                          <span className="game-row-description">
                            {game.description}
                          </span>
                        )}
                      </span>

                      <span className="game-row-link">
                        View releases <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <footer className="site-footer">
              <span>GAME RELEASE DATABASE</span>
              <span>Built for players, collectors, and the curious.</span>
            </footer>
          </main>
        }
      />

      <Route path="/games/:id" element={<GameDetailsRoute />} />
    </Routes>
  );
}

export default App;
