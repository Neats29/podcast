import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/search")
      .then(r => r.json())
      .then(r => {
        console.log(r);
        setResults(r.results);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {results.map((r, i) => {
          return <p key={i}>{r.title}</p>;
        })}
      </header>
    </div>
  );
}

export default App;
