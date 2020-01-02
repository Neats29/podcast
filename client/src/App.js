import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { Router, Link } from "@reach/router";
import { SnippetLogo } from "./snippet";

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
    return <div>Loading...</div>;
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
                  src={e.image}
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

  const [snippetLoaderVisible, showSnippetLoader] = useState(false);

  const [snippetText, setSnippetText] = useState("");

  const audioRef = useRef(null);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h2>{data.title}</h2>
      <img src={data.image} className="" width={100} height={100} />
      <audio controls src={data.enclosure.url} ref={audioRef}></audio>
      <SnippetLogo
        width="50px"
        height="50px"
        onClick={() => {
          const endTime = audioRef.current.currentTime;
          let startTime = endTime - 20;

          if (startTime < 0) {
            startTime = 0;
          }

          showSnippetLoader(true);

          fetch(`http://localhost:3001/createSnippet`, {
            body: JSON.stringify({
              url: data.enclosure.url,
              endTime,
              startTime
            }),
            headers: {
              "content-type": "application/json"
            },
            method: "POST"
          })
            .then(data => data.json())
            .then(data => {
              if (data) {
                showSnippetLoader(false);
                setSnippetText(data.text);
              }
            });
        }}
      ></SnippetLogo>
      {snippetLoaderVisible && <div className="snippet-loader"></div>}

      {snippetText.length > 0 && (
        <div>
          <p>{snippetText}</p>
        </div>
      )}
    </>
  );
};

export default App;
