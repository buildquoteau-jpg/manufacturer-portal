// Minimal layout for iframe-embedded supplier widget pages.
// Hides the GlobalNav (also done in GlobalNav.tsx) and the testing banner.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #bq-testing-banner { display: none !important; }
        body {
          background: #f9fafb !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
        }
      `}</style>
      {children}
    </>
  )
}
