import { useState } from "react"
import axios from "axios"

export default function CampaignSimulator(){

const [budget,setBudget] = useState("")
const [state,setState] = useState("")
const [result,setResult] = useState(null)

const simulate = async ()=>{

const res = await axios.post(
"https://voterspheres-backend-2pap.onrender.com/autopilot/strategy",
{
state,
budget
}
)

setResult(res.data)

}

return(

<div style={{padding:"30px"}}>

<h1>AI Campaign Simulator</h1>

<input
placeholder="State"
value={state}
onChange={e=>setState(e.target.value)}
/>

<input
placeholder="Budget"
value={budget}
onChange={e=>setBudget(e.target.value)}
/>

<button onClick={simulate}>Simulate Campaign</button>

{result && (

<div style={{marginTop:"20px"}}>

<h3>AI Strategy Output</h3>

<pre>

{JSON.stringify(result,null,2)}

</pre>

</div>

)}

</div>

)

}
