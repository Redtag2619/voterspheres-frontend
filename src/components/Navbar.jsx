import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <div style={{background:"#0f172a", padding:"16px", color:"white"}}>

      <h2>VoterSpheres Intelligence</h2>

      <div style={{display:"flex", gap:"20px", marginTop:"10px"}}>

        <Link to="/">Dashboard</Link>
        <Link to="/candidates">Candidates</Link>
        <Link to="/map">Election Map</Link>
        <Link to="/donors">Donor Network</Link>
        <Link to="/warroom">AI War Room</Link> 
        <Link to="/ai">AI Strategy</Link>

      </div>

    </div>
  )
}
