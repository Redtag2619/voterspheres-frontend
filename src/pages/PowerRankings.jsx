import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"

export default function PowerRankings(){

const [rankings,setRankings] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/consultants/power-rankings")
.then(res=>{
setRankings(res.data.rankings || [])
})

},[])

return(

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.3}}
>

<h2>Political Power Rankings</h2>

<table style={{width:"100%",color:"#e2e8f0"}}>

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

</motion.div>

)

}
