import { useEffect, useState } from "react"
import axios from "axios"
import { Bar } from "react-chartjs-2"
import { motion } from "framer-motion"

export default function FundraisingDashboard(){

const [data,setData] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/money/fundraising")
.then(res=>{
setData(res.data.fundraising || [])
})

},[])

const chartData = {

labels:data.map(d=>d.candidate),

datasets:[
{
label:"Fundraising",
data:data.map(d=>d.total_fundraising || 0)
}
]

}

return(

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{duration:.5}}
>

<h2>Fundraising Dashboard</h2>

<Bar data={chartData}/>

</motion.div>

)

}
