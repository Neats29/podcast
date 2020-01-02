import React, { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { Router, Link } from "@reach/router";
import { SnippetLogo } from "./snippet"
import Slider from 'react-input-slider';

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
    <header className="App-header">
      <div>{data.title}</div>
      <div>{data.author}</div>
      {data.description && <div>{data.description.long}</div>}
      <ul>
        {data.episodes.map((e, i) => {
          return (
            <li>
              <Link to={`/episodes/${props.id}/${btoa(e.guid)}`}>
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

  const [snippetText, setSnippetText] = useState([])

  const [playbackSpeed, setPlaybackSpeed] = useState({ x: 1 });

  const audioRef = useRef(null);

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
      <form>
        <div>{`Playback Speed ${playbackSpeed.x}`}</div>
        <Slider
          axis="x"
          x={playbackSpeed.x}
          xstep={0.1}
          xmax={3.5}
          xmin={0.5}
          onChange={({ x }) => {
            setPlaybackSpeed(playbackSpeed => ({ ...playbackSpeed, x: parseFloat(x.toFixed(2)) }))
            audioRef.current.playbackRate = x
          }
          }
        ></Slider>
      </form>
      <SnippetLogo width="50px" height="50px"
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
                showSnippetLoader(false)
                setSnippetText(snippetText.concat([data.text]))
              }
            });
        }}
      ></SnippetLogo>
      {snippetLoaderVisible && <div className="snippet-loader"></div>}

      {
        snippetText.length > 0 && (
          <div>
            {snippetText.map((s, i) => {
              return (
                <div>
                  <p key={i}>{s}</p>
                  <br />
                </div>
              )

            })}
          </div>
        )
      }
    </>
  );
};

export default App;
