export default function ResponsiveRow({

  title,

  subtitle,

  meta = [],

  alert,

  right,

  active = false,

  live = false,

  className = "",

  expanded = false,

}) {

  const normalizedMeta = [...meta];

 

  while (normalizedMeta.length < 4) {

    normalizedMeta.push({ label: "", value: "" });

  }

 

  return (

    <div

      className={[

        "vs-card-muted",

        active ? "vs-row-active-pulse" : "",

        live ? "vs-row-live-flash" : "",

        expanded ? "vs-responsive-row-expanded" : "",

        className,

      ]

        .filter(Boolean)

        .join(" ")}

      style={{

        width: "100%",

        maxWidth: "100%",

        overflow: "visible",

        minWidth: 0,

      }}

    >

      <div

        className="vs-responsive-row"

        style={{

          display: "grid",

          gridTemplateColumns: right

            ? expanded

              ? "minmax(0, 1fr) minmax(132px, auto)"

              : "minmax(0, 1fr) 132px"

            : "minmax(0, 1fr)",

          gap: "16px",

          alignItems: expanded ? "start" : "center",

          width: "100%",

          maxWidth: "100%",

          minWidth: 0,

          overflow: "visible",

        }}

      >

        <div

          className="vs-responsive-left"

          style={{

            minWidth: 0,

            maxWidth: "100%",

            overflow: "visible",

          }}

        >

          <div

            style={{

              display: "flex",

              alignItems: "center",

              gap: "8px",

              flexWrap: "wrap",

              minWidth: 0,

              maxWidth: "100%",

            }}

          >

            {alert ? <span className={alert} /> : null}

 

            <div

              className="vs-row-title"

              style={{

                minWidth: 0,

                maxWidth: "100%",

                width: "100%",

                whiteSpace: "normal",

                overflow: "visible",

                textOverflow: "clip",

                overflowWrap: "anywhere",

                wordBreak: "break-word",

                lineHeight: 1.45,

              }}

            >

              {title}

            </div>

          </div>

 

          {subtitle ? (

            <div

              className="vs-row-subtitle"

              style={{

                minWidth: 0,

                maxWidth: "100%",

                width: "100%",

                whiteSpace: "normal",

                overflow: "visible",

                textOverflow: "clip",

                overflowWrap: "anywhere",

                wordBreak: "break-word",

                lineHeight: 1.55,

              }}

            >

              {subtitle}

            </div>

          ) : null}

 

          <div

            className="vs-responsive-meta"

            style={{

              display: "grid",

              gridTemplateColumns: expanded

                ? "repeat(2, minmax(0, 1fr))"

                : "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",

              gap: expanded ? "12px 18px" : "12px",

              width: "100%",

              maxWidth: "100%",

              minWidth: 0,

              overflow: "visible",

              marginTop: "12px",

            }}

          >

            {normalizedMeta.slice(0, 4).map((item, index) => (

              <div

                key={`${item.label || "empty"}-${index}`}

                className="vs-meta-block"

                style={{

                  minWidth: 0,

                  maxWidth: "100%",

                  overflow: "visible",

                  paddingRight: 0,

                  borderRight: 0,

                  opacity: item.label ? 1 : 0,

                }}

              >

                <div

                  className="vs-meta-label"

                  style={{

                    display: "block",

                    width: "100%",

                    minWidth: 0,

                    whiteSpace: "normal",

                    overflow: "visible",

                    textOverflow: "clip",

                    overflowWrap: "anywhere",

                    wordBreak: "break-word",

                    letterSpacing: "0.08em",

                    textTransform: "uppercase",

                  }}

                >

                  {item.label}

                </div>

 

                <div

                  className="vs-meta-value"

                  title={

                    typeof item.value === "string" ||

                    typeof item.value === "number"

                      ? String(item.value)

                      : undefined

                  }

                  style={{

                    display: "block",

                    width: "100%",

                    minWidth: 0,

                    whiteSpace: "normal",

                    overflow: "visible",

                    textOverflow: "clip",

                    overflowWrap: "anywhere",

                    wordBreak: "break-word",

                    lineHeight: 1.45,

                  }}

                >

                  {item.value ?? "—"}

                </div>

              </div>

            ))}

          </div>

        </div>

 

        {right ? (

          <div

            className="vs-responsive-right"

            style={{

              width: expanded ? "auto" : "132px",

              minWidth: "132px",

              maxWidth: expanded ? "none" : "132px",

              overflow: "visible",

              justifySelf: "end",

              display: "flex",

              justifyContent: "flex-end",

              alignItems: "center",

              flexWrap: "wrap",

            }}

          >

            {right}

          </div>

        ) : null}

      </div>

    </div>

  );

}

