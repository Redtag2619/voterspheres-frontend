import { useEffect, useState } from "react" 
import axios from "axios"
import { motion } from "framer-motion"

export default function AIWarRoom(){

const [alerts,setAlerts] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/ai/war-room")
.then(res=>{
setAlerts(res.data || [])
})

},[])

return(

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.4}}
>

<h2>AI War Room</h2>

{alerts.map((a,i)=>(

<div
key={i}
style={{
background:"rgba(255,0,0,.1)",
padding:"10px",
marginBottom:"10px",
borderRadius:"8px"
}}
>

{a.message}

</div>

))}

</motion.div>

)

}
