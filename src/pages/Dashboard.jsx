import { useEffect, useState } from "react"
import { getElectionForecast } from "../services/api"

export default function Dashboard() {

  const [forecast, setForecast] = useState([])

  useEffect(() => {

    getElectionForecast().then(res => {
      setForecast(res.data)
    })

  }, [])

  return (
    <div style={{padding:"30px"}}>

      <h1>Political Intelligence Dashboard</h1>

      <h3>Election Forecast</h3>

      {forecast.map(race => (
        <div key={race.id} style={{border:"1px solid #ddd", margin:"10px", padding:"10px"}}>
          {race.state} - {race.office} - Win Probability: {race.win_probability}
        </div>
      ))}

    </div>
  )
}
