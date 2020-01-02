import React, { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { Router, Link } from "@reach/router";

function App() {
  return (
    <div className="App">
      <Router>
        <Search path="/" />
        <Episodes path="episodes/:id" />
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
    <header className="App-header">
      <input
        type="text"
        onChange={e => {
          searchTermRef.current = e.target.value;
          setSearchTerm(e.target.value);
        }}
      />
      <ul>
        {results.map((r, i) => {
          return (
            <li key={i} className="search-result-item">
              <Link to={`/episodes/${r.trackId}`}>
                <img
                  src={r.artworkUrl100}
                  className="search-result-item-img"
                  width={100}
                  height={100}
                />
                <span className="search-result-item-artist">
                  {r.artistName}
                </span>
                <span className="search-result-item-name">
                  {r.collectionName}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
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
    <header className="App-header">
      <div>{data.title}</div>
      <div>{data.author}</div>
      <div>{data.description.long}</div>
      <ul>
        {data.episodes.map((e, i) => {
          return (
            <li>
              <span>{e.title}</span>
              <span>{e.published}</span>
            </li>
          );
        })}
      </ul>
    </header>
  );
};

export default App;
