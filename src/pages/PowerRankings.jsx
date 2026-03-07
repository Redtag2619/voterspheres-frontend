import { useEffect, useState } from "react"
import axios from "axios"

export default function PowerRankings(){

const [rankings,setRankings] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/consultants/power-rankings")
.then(res=>{
setRankings(res.data.rankings)
})

},[])

return(

<div style={{padding:"30px"}}> 
  
<div className="glass-panel panel-hover">

<h1>Political Power Rankings</h1>

<table border="1" cellPadding="10">

<thead>

<tr>
<th>Rank</th>
<th>Consultant</th>
<th>Campaigns</th>
</tr>

</thead>

<tbody>

{rankings.map(r=>(
<tr key={r.rank}>
<td>{r.rank}</td>
<td>{r.consultant}</td>
<td>{r.campaigns}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}
