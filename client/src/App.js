import "./App.css";

import React from "react";
import { Router } from "@reach/router";
import { Provider } from "react-redux";
import { store } from "./store";
import { Search } from "./pages/Search";
import { Episodes } from "./pages/Episodes";
import { Episode } from "./pages/Episode";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Search path="/podnotes" />
        <Episodes path="podnotes/episodes/:id" />
        <Episode path="podnotes/episodes/:id/:guid" />
      </Router>
    </Provider>
  );
}

export default App;
