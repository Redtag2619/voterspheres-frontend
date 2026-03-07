import { useEffect, useState } from "react"
import axios from "axios"
import { Line } from "react-chartjs-2"
import { motion } from "framer-motion"

export default function ElectionForecast(){

const [forecast,setForecast] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/ai/forecast")
.then(res=>{
setForecast(res.data || [])
})

},[])

const chartData = {

labels:forecast.map(r=>r.state),

datasets:[
{
label:"Win Probability",
data:forecast.map(r=>r.probability || 50)
}
]

}

return(

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.1}}
>

<h2>Election Forecast</h2>

<Line data={chartData}/>

</motion.div>

)

}
