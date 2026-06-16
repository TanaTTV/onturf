import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ONTURF — find shows. get found.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default link-preview card shown when onturf.com is shared (IG, Discord, iMessage…).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          color: "#f4f4f2",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "9999px",
              background: "#ff3b1f",
            }}
          />
          <div style={{ fontSize: "30px", letterSpacing: "8px", color: "#9b9b96" }}>
            ALBUQUERQUE — NM
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "210px",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-6px",
            }}
          >
            ONTURF
          </div>
          <div style={{ fontSize: "52px", color: "#d9d6cf", marginTop: "16px" }}>
            find shows. get found.
          </div>
        </div>

        <div style={{ fontSize: "28px", letterSpacing: "6px", color: "#9b9b96" }}>
          SHOWS · ARTISTS · LINK PAGES
        </div>
      </div>
    ),
    { ...size }
  );
}
