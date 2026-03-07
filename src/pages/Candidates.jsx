import { useEffect, useState } from "react"
import { getCandidates } from "../services/api"

export default function Candidates() {

  const [candidates, setCandidates] = useState([])

  useEffect(() => {

    getCandidates().then(res => {
      setCandidates(res.data)
    })

  }, [])

  return (
    <div style={{padding:"30px"}}>

      <h1>Candidate Intelligence</h1>

      {candidates.map(c => (
        <div key={c.id} style={{border:"1px solid #ddd", margin:"10px", padding:"10px"}}>

          <h3>{c.name}</h3>

          <p>{c.party}</p>

          <p>{c.state}</p>

          <p>{c.office}</p>

        </div>
      ))}

    </div>
  )
}
