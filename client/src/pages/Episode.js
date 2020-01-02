import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Slider from "react-input-slider";
import { getPodcast } from "../store";
import { SnippetLogo } from "../snippet";

export const Episode = props => {
  const dispatch = useDispatch();
  const data = useSelector(state => state.podcasts.byId[props.id]);

  const [snippetData, setSnippetData] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState({ x: 1 });
  const audioRef = useRef(null);

  useEffect(() => {
    if (!data) {
      getPodcast(dispatch, props.id);
    }
  }, [props.id]);

  if (!data) {
    return (
      <div className="snippet-loader-page">
        <div className="snippet-loader"></div>
      </div>
    );
  }

  const episode = data.episodes.find(x => x.guid === atob(props.guid));

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
            src={episode.image}
            className="episode-player-img"
            width={300}
            height={300}
          />
          <div className="episode-player-content">
            <h2>{episode.title}</h2>
            <div className="episode-player-controls">
              <audio
                controls
                src={episode.enclosure.url}
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
            <div>
              <h3>Snippets</h3>
              <div>Click the quote logo to create a new snippet</div>
            </div>
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
                    url: episode.enclosure.url,
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
          </div>

          <ul className="episode-snippets">
            {snippetData.map((s, i) => {
              return (
                <div key={i} className="episode-snippet">
                  {s.loading && <div className="snippet-loader"></div>}
                  {s.text && <p className="episode-snippet-quote">{s.text}</p>}
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
