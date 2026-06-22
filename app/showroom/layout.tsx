// Renders as a standalone "supplier website" — no portal chrome, no testing banner.
export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #bq-testing-banner { display: none !important; }
        body { background: #f5f6f7 !important; }
      `}</style>
      <div style={{
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1f2937',
        background: '#f5f6f7',
      }}>
        {children}
      </div>
    </>
  )
}
