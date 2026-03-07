import { useEffect, useState } from "react"
import { getWarRoomAlerts } from "../services/api"

export default function AIWarRoom(){

const [alerts,setAlerts] = useState([])

useEffect(()=>{

getWarRoomAlerts().then(res=>{
setAlerts(res.data)
})

},[])

return(

<div style={{padding:"30px"}}> 
  
<div className="glass-panel panel-hover">

<h1>AI Campaign War Room</h1>

{alerts.map(a => (

<div key={a.id} style={{border:"1px solid red", padding:"10px", margin:"10px"}}>

<p>{a.message}</p>

</div>

))}

</div>

)

}
