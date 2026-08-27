import { Navigate, useLocation } from "react-router-dom";

export default function PlatformTour() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") === "admin" ? "admin" : "platform"; 

  return (
    <Navigate
      to={{
        pathname: "/executive-workspace",
        search: `?tour=${mode}`,
      }}
      replace
    />
  );
}
