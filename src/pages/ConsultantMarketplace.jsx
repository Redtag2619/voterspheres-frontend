import { useEffect, useState } from "react"
import axios from "axios"

export default function ConsultantMarketplace(){

const [consultants,setConsultants] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/consultants")
.then(res=>{

setConsultants(res.data)

})

},[])

return(

<div style={{padding:"30px"}}>

<h1>Consultant Marketplace</h1>

{consultants.map(c=>(

<div key={c.id}
style={{
border:"1px solid #ddd",
padding:"15px",
margin:"10px"
}}>

<h3>{c.name}</h3>

<p>Specialty: {c.specialty}</p>

<p>State: {c.state}</p>

<button>Contact</button>

</div>

))}

</div>

)

}
