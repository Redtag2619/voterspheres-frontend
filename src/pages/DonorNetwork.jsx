import { useEffect, useRef } from "react"
import * as d3 from "d3"
import axios from "axios"
import { motion } from "framer-motion"

export default function DonorNetwork(){

const ref = useRef()

useEffect(()=>{

axios.get("https://voterspheres-backend-2pap.onrender.com/influence/donor-network")
.then(res=>{

const data = res.data.network || []

const nodes=[]
const links=[]

data.forEach(d=>{

nodes.push({id:d.donor,type:"donor"})
nodes.push({id:d.candidate,type:"candidate"})

links.push({
source:d.donor,
target:d.candidate
})

})

const svg=d3.select(ref.current)
.attr("width",800)
.attr("height",400)

const simulation=d3.forceSimulation(nodes)
.force("link",d3.forceLink(links).id(d=>d.id).distance(120))
.force("charge",d3.forceManyBody().strength(-200))
.force("center",d3.forceCenter(400,200))

const link=svg.append("g")
.selectAll("line")
.data(links)
.enter()
.append("line")
.style("stroke","#999")

const node=svg.append("g")
.selectAll("circle")
.data(nodes)
.enter()
.append("circle")
.attr("r",7)
.style("fill",d=>d.type==="donor"?"#22c55e":"#f59e0b")

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

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.2}}
>

<h2>Donor Influence Network</h2>

<svg ref={ref}></svg>

</motion.div>

)

}
