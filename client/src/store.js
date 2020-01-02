import { createStore, applyMiddleware } from "redux";

let initialState = {
  search: {
    term: "",
    results: []
  }
};

function init() {
  const cached = localStorage.getItem("store");
  if (cached) {
    initialState = JSON.parse(cached);
  }
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

function reducer(state = initialState, action) {
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
    default:
      return state;
  }
}

init();

export const store = createStore(reducer, applyMiddleware(persist));
