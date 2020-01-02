import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { Router, Link } from "@reach/router";
import { SnippetLogo } from "./snippet";
import Slider from "react-input-slider";

function App() {
  return (
    <div className="app">
      <Router>
        <Search path="/" />
        <Episodes path="episodes/:id" />
        <Episode path="episodes/:id/:guid" />
      </Router>
    </div>
  );
}

const Search = () => {
  const searchTermRef = useRef("");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      if (searchTerm !== searchTermRef.current) {
        return;
      }

      fetch(
        `https://itunes.apple.com/search?term=${searchTerm}&entity=podcast&limit=100`
      )
        .then(r => r.json())
        .then(r => {
          setResults(r.results);
        });
    }, 750);
  }, [searchTerm]);

  return (
    <div className="search-page">
      <div className="search-input-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="Search podcasts..."
          onChange={e => {
            searchTermRef.current = e.target.value;
            setSearchTerm(e.target.value);
          }}
        />
      </div>
      <ul className="search-results">
        {results.map((r, i) => {
          return (
            <li key={i}>
              <Link
                to={`/episodes/${r.trackId}`}
                className="search-result-item"
              >
                <img
                  src={r.artworkUrl100}
                  className="search-result-item-img"
                  width={100}
                  height={100}
                />
                <span className="search-result-item-details">
                  <span className="search-result-item-name">
                    {r.collectionName}
                  </span>
                  <span className="search-result-item-artist">
                    by {r.artistName}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Episodes = props => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/episodes?id=${props.id}`)
      .then(r => r.json())
      .then(r => {
        setData(r);
      });
  }, [props.id]);

  if (!data) {
    return (
      <div className="snippet-loader-page">
        <div className="snippet-loader"></div>
      </div>
    );
  }

  return (
    <div className="episodes-page">
      <div className="podcast-header">
        <div className="podcast-header-content">
          <div className="podcast-header-title">{data.title}</div>
          <div className="podcast-header-author">by {data.author}</div>
          {data.description && (
            <div className="podcast-header-description">
              {data.description.long}
            </div>
          )}
        </div>
      </div>
      <ul className="podcast-episodes">
        {data.episodes.map((e, i) => {
          return (
            <li key={i}>
              <Link
                to={`/episodes/${props.id}/${btoa(e.guid)}`}
                className="podcast-episode-item"
              >
                <img
                  className="podcast-episode-item-img"
                  src={e.image || data.image}
                  width={50}
                  height={50}
                />
                <span className="podcast-episode-item-details">
                  <span className="podcast-episode-item-title">{e.title}</span>
                  <span className="podcast-episode-item-published">
                    Published {e.published}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Episode = props => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/episodes?id=${props.id}&guid=${props.guid}`)
      .then(r => r.json())
      .then(r => {
        setData(r);
      });
  }, [props.guid]);

  const [snippetData, setSnippetData] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState({ x: 1 });
  const audioRef = useRef(null);

  if (!data) {
    return (
      <div className="snippet-loader-page">
        <div className="snippet-loader"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="podcast-header">
        <div className="podcast-header-content">
          <div className="podcast-header-title">{data.title}</div>
          <div className="podcast-header-author">by {data.author}</div>
          {data.description && (
            <div className="podcast-header-description">
              {data.description.long}
            </div>
          )}
        </div>
      </div>
      <div className="episode-content">
        <div className="episode-player">
          <img
            src={data.episode.image}
            className="episode-player-img"
            width={300}
            height={300}
          />
          <div className="episode-player-content">
            <h2>{data.episode.title}</h2>
            <div className="episode-player-controls">
              <audio
                controls
                src={data.episode.enclosure.url}
                ref={audioRef}
              ></audio>
              <form>
                <div className="playback-speed-label">{`Speed ${playbackSpeed.x}x`}</div>
                <Slider
                  axis="x"
                  x={playbackSpeed.x}
                  xstep={0.1}
                  xmax={3.5}
                  xmin={0.5}
                  onChange={({ x }) => {
                    setPlaybackSpeed(playbackSpeed => ({
                      ...playbackSpeed,
                      x: parseFloat(x.toFixed(2))
                    }));
                    audioRef.current.playbackRate = x;
                  }}
                ></Slider>
              </form>
            </div>
          </div>
        </div>
        <div className="episode-snippets-container">
          <div className="episode-snippets-header">
            <h3>Snippets</h3>
            <SnippetLogo
              className="create-snippet-button"
              width="50px"
              height="50px"
              onClick={() => {
                const endTime = audioRef.current.currentTime;
                console.log("endTime", endTime);
                let startTime = endTime - 15;

                if (startTime < 0) {
                  startTime = 0;
                }

                console.log("startTime", startTime);
                const mins = Math.floor(startTime % 60);
                const snippetTimeRange = `${Math.floor(startTime / 60)}:${
                  mins < 10 ? "0" + mins : mins
                }`;

                setSnippetData(
                  snippetData.concat([
                    { loading: true, timestamp: snippetTimeRange }
                  ])
                );

                fetch(`http://localhost:3001/createSnippet`, {
                  body: JSON.stringify({
                    url: data.episode.enclosure.url,
                    endTime,
                    startTime
                  }),
                  headers: {
                    "content-type": "application/json"
                  },
                  method: "POST"
                })
                  .then(data => data.json())
                  .then(snippetResponse => {
                    if (snippetResponse) {
                      setSnippetData(
                        snippetData
                          .filter(x => !x.loading)
                          .concat([
                            {
                              text: snippetResponse.text,
                              timestamp: snippetTimeRange
                            }
                          ])
                      );
                    }
                  });
              }}
            />
            {snippetData.length === 0 ? (
              <div>Click the quote logo to create a new snippet</div>
            ) : (
              <span>Click on the snippets to edit them</span>
            )}
          </div>

          <ul className="episode-snippets">
            {snippetData.map((s, i) => {
              return (
                <div key={i} className="episode-snippet">
                  {s.loading && <div className="snippet-loader"></div>}
                  {s.text && (
                    <div
                      contenteditable="true"
                      className="episode-snippet-quote"
                      onChange={e => {
                        console.log(e);
                        const snippetDataCopy = [...snippetData];
                        snippetDataCopy[i].text = e.target.value;
                        setSnippetData(snippetDataCopy);
                      }}
                    >
                      {s.text}
                    </div>
                  )}
                  <p className="episode-snippet-timestamp">{`At: ${s.timestamp} `}</p>
                </div>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
