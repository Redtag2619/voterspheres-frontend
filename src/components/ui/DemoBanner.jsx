import { useDemoMode } from "../../context/DemoModeContext.jsx";

export default function DemoBanner({
  active = false,
  text = "Demo data is active for this module.",
}) {
  const { demoMode } = useDemoMode();

  if (!active && !demoMode) return null;

  return <div className="vs-banner vs-banner-demo">{text}</div>;
}
