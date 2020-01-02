import React, { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { Router, Link } from "@reach/router";
import { SnippetLogo } from "./snippet"

function App() {
  return (
    <div className="App">
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

  console.log(data)

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
              <Link to={`/episodes/${props.id}/${btoa(e.guid)}`} >
                <span>{e.title}</span>
              </Link>
              <span>{e.published}</span>
            </li>
          );
        })}
      </ul>
    </header>
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

  const [snippetLoaderVisible, showSnippetLoader] = useState(false)

  const [snippetText, setSnippetText] = useState("")


  const audioRef = useRef(null)

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h2>{data.title}</h2>
      <img
        src={data.image}
        className=""
        width={100}
        height={100}
      />
      <audio controls src={data.enclosure.url} ref={audioRef}>
      </audio>
      <SnippetLogo width="50px" height="50px"
        onClick={() => {
          const endTime = audioRef.current.currentTime;
          let startTime = endTime - 20;

          if (startTime < 0) {
            startTime = 0;
          }

          showSnippetLoader(true)

          fetch(`http://localhost:3001/createSnippet`, {
            body: JSON.stringify({
              url: data.enclosure.url,
              endTime,
              startTime,
            }),
            headers: {
              'content-type': "application/json"
            },
            method: "POST"
          }
          )
            .then(data => data.json())
            .then(data => {
              if (data) {
                showSnippetLoader(false)
                setSnippetText(data.text)
              }
            })
        }}

      ></SnippetLogo>
      {snippetLoaderVisible &&
        <div className="snippet-loader"></div>
      }

      {snippetText.length > 0 &&
        <div>
          <p>{snippetText}</p>
        </div>
      }
    </>
  )
}

export default App;
