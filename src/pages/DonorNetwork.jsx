import { useEffect, useRef } from "react"
import * as d3 from "d3"
import axios from "axios"

export default function DonorNetwork(){

const ref = useRef()

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/influence/donor-network")
.then(res=>{

const data = res.data.network

const nodes = []
const links = []

data.forEach(d => {

nodes.push({id: d.donor, type:"donor"})
nodes.push({id: d.candidate, type:"candidate"})

links.push({
source:d.donor,
target:d.candidate,
value:d.amount
})

})

const svg = d3.select(ref.current)
.attr("width",900)
.attr("height",600)

const simulation = d3.forceSimulation(nodes)
.force("link", d3.forceLink(links).id(d=>d.id).distance(120))
.force("charge", d3.forceManyBody().strength(-200))
.force("center", d3.forceCenter(450,300))

const link = svg
.append("g")
.selectAll("line")
.data(links)
.enter()
.append("line")
.style("stroke","#aaa")

const node = svg
.append("g")
.selectAll("circle")
.data(nodes)
.enter()
.append("circle")
.attr("r",8)
.style("fill", d=> d.type==="donor" ? "green" : "orange")

simulation.on("tick",()=>{

link
.attr("x1",d=>d.source.x)
.attr("y1",d=>d.source.y)
.attr("x2",d=>d.target.x)
.attr("y2",d=>d.target.y)

node
.attr("cx",d=>d.x)
.attr("cy",d=>d.y)

})

})

},[])

return(

<div style={{padding:"30px"}}> 
  
<div className="glass-panel panel-hover">

<h1>Donor Influence Network</h1>

<svg ref={ref}></svg>

</div>

)

}
