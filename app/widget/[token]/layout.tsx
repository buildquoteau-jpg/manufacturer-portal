// Overrides the dark portal theme so the widget renders on a clean white background.
// Also hides the testing banner — these pages are designed to be embedded on supplier websites.
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #bq-testing-banner { display: none !important; }
        body {
          background: #f9fafb !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `}</style>
      {children}
    </>
  )
}
