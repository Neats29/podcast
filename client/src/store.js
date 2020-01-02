import { createStore, applyMiddleware } from "redux";

function getInitialState() {
  let initialState = {
    version: 3,
    search: {
      term: "",
      results: []
    },
    podcasts: {
      byId: {}
    }
  };

  const cached = localStorage.getItem("store");
  if (!cached) {
    console.log("No cached state");
    return initialState;
  }

  const parsedCached = JSON.parse(cached);
  if (parsedCached.version !== initialState.version) {
    console.log(
      `Not loading cached state due to version mismatch. Wanted ${initialState.version} but ${parsedCached.version} was retrieved from cache.`
    );
    return initialState;
  }

  console.log("Loaded cached state");
  return parsedCached;
}

const persist = store => next => action => {
  let result = next(action);
  localStorage.setItem("store", JSON.stringify(store.getState()));
  return result;
};

export async function search(dispatch, term) {
  dispatch({
    type: "SEARCH/LOADING",
    data: term
  });

  return fetch(
    `https://itunes.apple.com/search?term=${term}&entity=podcast&limit=100`
  )
    .then(r => r.json())
    .then(r => {
      dispatch({
        type: "SEARCH/RESULTS",
        data: r.results
      });
    });
}

export async function getPodcast(dispatch, id) {
  return fetch(`http://localhost:3001/episodes?id=${id}`)
    .then(r => r.json())
    .then(r => {
      dispatch({
        type: "FETCH_PODCAST/SUCCESS",
        data: r
      });
    });
}

function reducer(state = getInitialState(), action) {
  switch (action.type) {
    case "SEARCH/LOADING":
      return {
        ...state,
        search: {
          ...state.search,
          loading: true,
          term: action.data
        }
      };
    case "SEARCH/RESULTS":
      return {
        ...state,
        search: {
          ...state.search,
          loading: false,
          results: action.data
        }
      };
    case "FETCH_PODCAST/SUCCESS":
      return {
        ...state,
        podcasts: {
          ...state.podcasts,
          byId: {
            ...state.podcasts.byId,
            [action.data.id]: action.data
          }
        }
      };
    default:
      console.warn("unhandled redux action", action);
      return state;
  }
}

export const store = createStore(reducer, applyMiddleware(persist));
