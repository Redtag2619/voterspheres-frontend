import React from "react";

function LoadingState({ label = "Loading terminal data..." }) {
  return <div className="vs-loading-block">{label}</div>;
}

export default LoadingState;
