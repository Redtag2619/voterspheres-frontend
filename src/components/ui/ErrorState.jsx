import React from "react";

function ErrorState({ message = "Unable to load data." }) {
  return <div className="vs-error-block">{message}</div>;
}

export default ErrorState;
