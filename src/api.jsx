import { useEffect, useState } from "react";

const API = "http://localhost:10000/api";

export default function App() {

  const [states, setStates] = useState([]);
  const [parties, setParties] = useState([]);
  const [offices, setOffices] = useState([]);
  const [counties, setCounties] = useState([]);

  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [party, setParty] = useState("");
  const [office, setOffice] = useState("");
  const [county, setCounty] = useState("");

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 25;

  /* ================= LOAD DROPDOWNS ================= */

  useEffect(() => {
    fetch(`${API}/dropdowns/states`).then(r => r.json()).then(setStates);
    fetch(`${API}/dropdowns/parties`).then(r => r.json()).then(setParties);
    fetch(`${API}/dropdowns/offices`).then(r => r.json()).then(setOffices);
  }, []);

  /* ================= COUNTIES BY STATE ================= */

  useEffect(() => {
    if (!state) {
      setCounties([]);
      setCounty("");
      return;
    }

    fetch(`${API}/dropdowns/counties?state=${state}`)
      .then(r => r.json())
      .then(setCounties);
  }, [state]);

  /* ================= SEARCH ================= */

  const searchCandidates = async (newPage = 1) => {

    setPage(newPage);

    const params = new URLSearchParams({
      q: search,
      state,
      party,
      office,
      county,
      page: newPage,
      limit
    });

    const res = await fetch(`${API}/candidates?${params}`);
    const json = await res.json();

    setResults(json.data);
    setTotal(json.total);
  };

  const totalPages = Math.ceil(total / limit);

  const renderPages = () => {
    const pages = [];

    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => searchCandidates(i)}
          style={{
            margin: "0 4px",
            fontWeight: i === page ? "bold" : "normal"
          }}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>

      <h1>VoterSpheres Candidate Search</h1>

      {/* ================= FILTERS ================= */}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 15 }}>

        <input
          placeholder="Search name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select value={state} onChange={e => setState(e.target.value)}>
          <option value="">All States</option>
          {states.map(s => (
            <option key={s.id} value={s.code}>{s.name}</option>
          ))}
        </select>

        <select value={county} onChange={e => setCounty(e.target.value)}>
          <option value="">All Counties</option>
          {counties.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={party} onChange={e => setParty(e.target.value)}>
          <option value="">All Parties</option>
          {parties.map(p => (
            <option key={p.id} value={p.abbreviation}>{p.name}</option>
          ))}
        </select>

        <select value={office} onChange={e => setOffice(e.target.value)}>
          <option value="">All Offices</option>
          {offices.map(o => (
            <option key={o.id} value={o.name}>{o.name}</option>
          ))}
        </select>

        <button onClick={() => searchCandidates(1)}>Search</button>

      </div>

      {/* ================= TOTAL ================= */}

      <div style={{ marginBottom: 10 }}>
        <strong>{total.toLocaleString()}</strong> results found
      </div>

      {/* ================= RESULTS ================= */}

      <table border="1" cellPadding="6" width="100%">

        <thead>
          <tr>
            <th>Name</th>
            <th>State</th>
            <th>County</th>
            <th>Party</th>
            <th>Office</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td>{r.full_name}</td>
              <td>{r.state}</td>
              <td>{r.county}</td>
              <td>{r.party}</td>
              <td>{r.office}</td>
              <td>{r.email}</td>
              <td>{r.phone}</td>
            </tr>
          ))}
        </tbody>

      </table>

      {/* ================= PAGINATION ================= */}

      <div style={{ marginTop: 15 }}>

        <button
          disabled={page === 1}
          onClick={() => searchCandidates(page - 1)}
        >
          Prev
        </button>

        {renderPages()}

        <button
          disabled={page === totalPages}
          onClick={() => searchCandidates(page + 1)}
        >
          Next
        </button>

      </div>

    </div>
  );
}
