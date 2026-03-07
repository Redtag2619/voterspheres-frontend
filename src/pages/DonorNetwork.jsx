import { useEffect, useState } from "react"
import { getDonorNetwork } from "../services/api"

export default function DonorNetwork(){

const [network,setNetwork] = useState([])

useEffect(()=>{

getDonorNetwork().then(res=>{
setNetwork(res.data)
})

},[])

return(

<div style={{padding:"30px"}}>

<h1>Political Influence Network</h1>

{network.map(n => (

<div key={n.id} style={{border:"1px solid #ddd", padding:"10px", margin:"10px"}}>

<p>Donor: {n.donor}</p>

<p>Candidate: {n.candidate}</p>

</div>

))}

</div>

)

}
