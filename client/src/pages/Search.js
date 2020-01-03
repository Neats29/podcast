import React, { useState, useEffect } from "react";
import { Link } from "@reach/router";
import { useDispatch, useSelector } from "react-redux";
import { search } from "../store";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [delay, value]);

  return debouncedValue;
}

export const Search = () => {
  const searchTerm = useSelector(state => state.search.term);
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchTerm);
  const deboundedSearchTerm = useDebounce(currentSearchTerm, 750);

  const results = useSelector(state => state.search.results);
  const dispatch = useDispatch();

  useEffect(() => {
    if (searchTerm === deboundedSearchTerm) {
      return;
    }
    search(dispatch, deboundedSearchTerm);
  });

  return (
    <div className="search-page">
      <div className="search-input-wrapper">
        <input
          className="search-input"
          type="text"
          value={currentSearchTerm}
          placeholder="Search podcasts..."
          onChange={e => {
            setCurrentSearchTerm(e.target.value);
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
                  alt={r.collectionName}
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
