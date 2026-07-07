export default function SearchLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #EBEBEB", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>StayNote</span>
        <span style={{ fontSize: "13px", color: "#888" }}>← 重新搜尋</span>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Query recap skeleton */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ width: "60px", height: "10px", background: "#F0F0F0", borderRadius: "6px", marginBottom: "10px" }} />
          <div style={{ width: "80%", height: "14px", background: "#F0F0F0", borderRadius: "6px" }} />
        </div>

        {/* AI matching indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "0 4px" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4B7BF5", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4B7BF5", display: "inline-block", animation: "pulse 1.2s ease-in-out 0.2s infinite" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4B7BF5", display: "inline-block", animation: "pulse 1.2s ease-in-out 0.4s infinite" }} />
          </div>
          <span style={{ fontSize: "13px", color: "#888" }}>AI 比對中，正在分析 StayNote 上萬則真實經驗分享…</span>
        </div>

        {/* Card skeletons */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", marginBottom: "12px", overflow: "hidden" }}>
            <div style={{ height: "140px", background: "#F5F5F5" }} />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <div style={{ width: "50px", height: "20px", background: "#F0F0F0", borderRadius: "10px" }} />
                <div style={{ width: "70px", height: "20px", background: "#F0F0F0", borderRadius: "10px" }} />
              </div>
              <div style={{ width: "65%", height: "16px", background: "#F0F0F0", borderRadius: "6px", marginBottom: "8px" }} />
              <div style={{ width: "40%", height: "12px", background: "#F5F5F5", borderRadius: "6px", marginBottom: "12px" }} />
              <div style={{ width: "100%", height: "12px", background: "#F5F5F5", borderRadius: "6px", marginBottom: "6px" }} />
              <div style={{ width: "80%", height: "12px", background: "#F5F5F5", borderRadius: "6px" }} />
            </div>
          </div>
        ))}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
