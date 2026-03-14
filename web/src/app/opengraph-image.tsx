import { ImageResponse } from "next/og";

export const alt = "Nightstand - Your Reading Pile, But It Actually Works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f2e8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative line (logo-inspired accent) */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 80,
            width: 72,
            height: 71,
            border: "3px solid #c9956a",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 80,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: "#2c1f0e",
              letterSpacing: "-0.02em",
            }}
          >
            Nightstand
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#2c1f0e",
              opacity: 0.85,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Your reading pile, but it actually works.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#2c1f0e",
              opacity: 0.6,
              textAlign: "center",
              maxWidth: 600,
              marginTop: 8,
            }}
          >
            Save articles into a quiet weekly reading list for the weekend.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
