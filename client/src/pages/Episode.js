import React, { useState, useEffect, useRef } from "react";
import { Link } from "@reach/router";
import { useSelector, useDispatch } from "react-redux";
import Slider from "react-input-slider";
import { getPodcast, createSnippet } from "../store";
import { SnippetLogo } from "../snippet";

export const Episode = props => {
  const [editing, setEditing] = useState(null);
  const [editedQuote, setEditedQuote] = useState("");
  const dispatch = useDispatch();
  const data = useSelector(state => state.podcasts.byId[props.id]);

  const snippets = useSelector(state => {
    if (!state.snippets[props.id]) {
      return [];
    }

    if (!state.snippets[props.id][props.guid]) {
      return [];
    }

    return state.snippets[props.id][props.guid];
  });
  const [playbackSpeed, setPlaybackSpeed] = useState({ x: 1 });
  const audioRef = useRef(null);

  useEffect(() => {
    if (!data) {
      getPodcast(dispatch, props.id);
    }
  });

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
          <Link
            to={`/podnotes/episodes/${props.id}`}
            className="podcast-header-title"
          >
            {data.title}
          </Link>
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
            alt={episode.title}
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

                createSnippet(
                  dispatch,
                  props.id,
                  props.guid,
                  episode.enclosure.url,
                  startTime,
                  endTime
                );
              }}
            />
          </div>

          <ul className="episode-snippets">
            {snippets.map((s, i) => {
              const mins = Math.floor(s.startTime % 60);
              const snippetTimeRange = `${Math.floor(s.startTime / 60)}:${
                mins < 10 ? "0" + mins : mins
              }`;

              return (
                <div key={i} className="episode-snippet">
                  {s.loading && (
                    <div
                      style={{ marginBottom: 20 }}
                      className="snippet-loader"
                    ></div>
                  )}
                  {s.text && editing !== s ? (
                    <p className="episode-snippet-quote">{s.text}</p>
                  ) : null}
                  {s.text && editing === s ? (
                    <textarea
                      className="episode-snippet-quote"
                      onChange={e => setEditedQuote(e.target.value)}
                    >
                      {s.text}
                    </textarea>
                  ) : null}
                  <div className="episode-snippet-controls">
                    <span
                      className="episode-snippet-edit"
                      onClick={() => {
                        if (editing === s) {
                          dispatch({
                            type: "CREATE_SNIPPET/SUCCESS",
                            data: {
                              id: props.id,
                              guid: props.guid,
                              startTime: s.startTime,
                              endTime: s.endTime,
                              text: editedQuote
                            }
                          });
                          setEditing(null);
                          setEditedQuote("");
                        } else {
                          setEditing(s);
                          setEditedQuote(s.text);
                        }
                      }}
                    >
                      {editing === s ? "Save" : "Edit"}
                    </span>
                    <span
                      className="episode-snippet-timestamp"
                      onClick={() => {
                        audioRef.current.currentTime = s.startTime;
                      }}
                    >{`At ${snippetTimeRange} `}</span>
                  </div>
                </div>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
