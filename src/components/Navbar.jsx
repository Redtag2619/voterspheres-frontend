import { Link } from "react-router-dom"

export default function Navbar() {

return (

<div
style={{
background:"#0f172a",
color:"white",
padding:"16px",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<h2 style={{margin:0}}>VoterSpheres</h2>

<div
style={{
display:"flex",
gap:"18px",
fontSize:"14px"
}}
>

<Link style={{color:"white"}} to="/">Dashboard</Link>

<Link style={{color:"white"}} to="/candidates">Candidates</Link>

<Link style={{color:"white"}} to="/map">Election Map</Link>

<Link style={{color:"white"}} to="/donors">Donor Network</Link>

<Link style={{color:"white"}} to="/warroom">AI War Room</Link>

<Link style={{color:"white"}} to="/forecast">Forecast</Link>

<Link style={{color:"white"}} to="/fundraising">Fundraising</Link>

<Link style={{color:"white"}} to="/rankings">Power Rankings</Link>

<Link style={{color:"white"}} to="/marketplace">Marketplace</Link>

<Link style={{color:"white"}} to="/simulator">Simulator</Link>

<Link style={{color:"white"}} to="/ai">AI Strategy</Link>

</div>

</div>

)

}
