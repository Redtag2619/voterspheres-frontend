import { useEffect, useState } from "react"
import axios from "axios"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

export default function ElectionForecast(){

const [forecast,setForecast] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/ai/forecast")
.then(res=>{

setForecast(res.data)

})

},[])

const data = {
labels: forecast.map(r=>r.state),
datasets:[
{
label:"Win Probability",
data:forecast.map(r=>r.probability || 50)
}
]
}

return(

<div style={{padding:"30px"}}>

<div className="glass-panel panel-hover">

<h1>Election Probability Forecast</h1>

<Line data={data}/>

</div>

)

}
