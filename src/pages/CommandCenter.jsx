import { motion } from "framer-motion"

import ElectionMap from "./ElectionMap"
import FundraisingDashboard from "./FundraisingDashboard"
import DonorNetwork from "./DonorNetwork"
import AIWarRoom from "./AIWarRoom"
import ElectionForecast from "./ElectionForecast"
import PowerRankings from "./PowerRankings"

export default function CommandCenter(){

return(

<div className="command-grid">

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{duration:.5}}
>

<ElectionMap/>

</motion.div>

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.1}}
>

<FundraisingDashboard/>

</motion.div>

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.2}}
>

<DonorNetwork/>

</motion.div>

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.3}}
>

<AIWarRoom/>

</motion.div>

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.4}}
>

<ElectionForecast/>

</motion.div>

<motion.div
className="glass-panel panel-hover"
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:.5}}
>

<PowerRankings/>

</motion.div>

</div>

)

}
