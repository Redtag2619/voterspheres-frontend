import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ElectionMap() {
  return (
    <div style={{ height: "80vh", width: "100%", padding: "16px", boxSizing: "border-box" }}>
      <div style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
        <MapContainer
          center={[38.9072, -77.0369]}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[38.9072, -77.0369]}>
            <Popup>VoterSpheres Election Map</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default ElectionMap;
