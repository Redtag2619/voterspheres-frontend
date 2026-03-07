import { useState } from "react"
import axios from "axios"

export default function AIChat(){

const [messages,setMessages] = useState([])
const [input,setInput] = useState("")

const sendMessage = async () => {

const userMessage = {role:"user", text:input}

setMessages([...messages,userMessage])

const res = await axios.post(
"https://voterspheres-backend-2pap.onrender.com/autopilot/strategy",
{ query: input }
)

const aiMessage = {
role:"ai",
text: JSON.stringify(res.data.strategy)
}

setMessages(m=>[...m,aiMessage])

setInput("")

}

return(

<div style={{padding:"30px"}}>

<h1>AI Campaign Strategy</h1>

<div style={{
height:"400px",
overflowY:"scroll",
border:"1px solid #ccc",
padding:"10px"
}}>

{messages.map((m,i)=>(
<div key={i}>
<strong>{m.role==="user"?"You":"AI"}:</strong>
<p>{m.text}</p>
</div>
))}

</div>

<input
value={input}
onChange={e=>setInput(e.target.value)}
placeholder="Ask AI about campaign strategy..."
style={{width:"80%",padding:"10px"}}
/>

<button onClick={sendMessage}>Send</button>

</div>

)

}
