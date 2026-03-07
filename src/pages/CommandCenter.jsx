import ElectionMap from "./ElectionMap"
import FundraisingDashboard from "./FundraisingDashboard"
import PowerRankings from "./PowerRankings"
import DonorNetwork from "./DonorNetwork"
import ElectionForecast from "./ElectionForecast"
import AIWarRoom from "./AIWarRoom"

export default function CommandCenter(){

return(

<div
style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gridTemplateRows:"400px 400px 400px",
gap:"10px",
padding:"10px"
}}
>

<div style={{border:"1px solid #ddd"}}>
<ElectionMap/>
</div>

<div style={{border:"1px solid #ddd"}}>
<FundraisingDashboard/>
</div>

<div style={{border:"1px solid #ddd"}}>
<DonorNetwork/>
</div>

<div style={{border:"1px solid #ddd"}}>
<AIWarRoom/>
</div>

<div style={{border:"1px solid #ddd"}}>
<ElectionForecast/>
</div>

<div style={{border:"1px solid #ddd"}}>
<PowerRankings/>
</div>

</div>

)

}
