import React, { useEffect } from "react";
import { Link } from "@reach/router";
import { useSelector, useDispatch } from "react-redux";
import { getPodcast } from "../store";

export const Episodes = props => {
  const dispatch = useDispatch();
  const data = useSelector(state => state.podcasts.byId[props.id]);

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
