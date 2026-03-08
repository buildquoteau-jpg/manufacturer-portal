'use client'

interface TopBarProps {
  currentStep: 1 | 2 | 3 | 4
}

const steps = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Review' },
  { n: 3, label: 'Send' },
  { n: 4, label: 'Done' },
]

export default function TopBar({ currentStep }: TopBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/portfolio" className="text-gray-500 hover:text-gray-300 text-xs tracking-widest uppercase transition-colors">
            &larr; Portfolio
          </a>
          <div className="flex flex-col">
            <span className="text-orange-500 font-bold text-lg tracking-tight leading-tight">BuildQuote</span>
            <span className="text-gray-500 text-xs leading-tight">Request for Quotation, Made Simple</span>
          </div>
        </div>
        <div className="flex gap-2">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                n === currentStep
                  ? 'bg-orange-500 text-white'
                  : n < currentStep
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              <span>{n}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
