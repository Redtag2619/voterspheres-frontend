import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";

export default function Dashboard() {
  return (
    <Page>
      <Section title="Campaign Overview">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px"
          }}
        >
          <Card>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Active Campaigns
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>12</div>
          </Card>

          <Card>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Fundraising Velocity
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>
              +18%
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Threat Level
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b" }}>
              Elevated
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Live Intelligence Feed">
        <Card>
          <div style={{ color: "#9ca3af", fontSize: "13px" }}>
            • Media narrative shift detected in Georgia Senate race
          </div>
          <div style={{ color: "#9ca3af", fontSize: "13px", marginTop: "6px" }}>
            • Mail delay reported at Atlanta NDC
          </div>
          <div style={{ color: "#9ca3af", fontSize: "13px", marginTop: "6px" }}>
            • Donor surge detected in Q2 digital channels
          </div>
        </Card>
      </Section>
    </Page>
  );
}
