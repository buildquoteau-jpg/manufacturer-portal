// Overrides the dark portal theme so the widget renders on a clean white background
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
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
