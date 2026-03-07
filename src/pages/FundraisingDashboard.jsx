import { useEffect, useState } from "react"
import axios from "axios"
import { Bar } from "react-chartjs-2"

export default function FundraisingDashboard(){

const [data,setData] = useState([])

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/money/fundraising")
.then(res=>{
setData(res.data.fundraising)
})

},[])

const chartData = {

labels: data.map(d=>d.candidate),

datasets:[
{
label:"Fundraising",
data:data.map(d=>d.total_fundraising)
}
]

}

return(

<div style={{padding:"30px"}}> 
  
<div className="glass-panel panel-hover">

<h1>Real-Time Fundraising</h1> 

<Bar data={chartData}/>

</div>

)

}
