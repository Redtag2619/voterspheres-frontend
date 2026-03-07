import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import { useEffect, useState } from "react"
import axios from "axios"
import "leaflet/dist/leaflet.css"

export default function ElectionMap() {

  const [races, setRaces] = useState([])

  useEffect(() => {

    axios
      .get("https://voterspheres-backend-2pap.onrender.com/map/national-map")
      .then(res => {
        setRaces(res.data.races)
      })

  }, [])

  return (

    <div style={{height:"90vh"}}>

      <h2 style={{padding:"10px"}}>National Election Map</h2>

      <MapContainer
        center={[37.8, -96]}
        zoom={4}
        style={{height:"100%", width:"100%"}}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {races.map(race => (

          <CircleMarker
            key={race.id}
            center={[race.lat || 38, race.lng || -97]}
            radius={8}
            color={race.party === "Democrat" ? "blue" : "red"}
          >

            <Popup>

              <strong>{race.name}</strong>

              <p>{race.office}</p>

              <p>{race.state}</p>

              <p>Fundraising: ${race.fundraising}</p>

            </Popup>

          </CircleMarker>

        ))}

      </MapContainer>

    </div>

  )
}
