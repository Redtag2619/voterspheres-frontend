import { useSearchParams } from "react-router-dom";
import VirtualTour from "../components/VirtualTour";

export default function PlatformTour() {
  const [params] = useSearchParams();
  const mode = params.get("mode") === "admin" ? "admin" : "public";

  return <VirtualTour mode={mode} />;
}