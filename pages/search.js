import { useState } from "react";
import { searchCandidates } from "../api";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await searchCandidates(query);
    setResults(res);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Candidate Search</h1>

      <input
        placeholder="Search name, state, office"
        onChange={e => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((c, i) => (
          <li key={i}>
            {c.name} — {c.office} — {c.state}
          </li>
        ))}
      </ul>
    </div>
  );
}
