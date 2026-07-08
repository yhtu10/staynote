import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32,
        background: "white",
        borderRadius: 8,
        border: "2px solid #111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#111",
        fontSize: 20,
        fontWeight: 800,
        fontFamily: "serif",
      }}>
        S
      </div>
    ),
    { ...size }
  )
}
