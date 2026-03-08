interface ToggleProps {
  value: 'delivery' | 'pickup'
  onChange: (value: 'delivery' | 'pickup') => void
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-600 w-fit">
      {(['delivery', 'pickup'] as const).map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
            value === option ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {option === 'delivery' ? 'Delivery' : 'Store Pick-up'}
        </button>
      ))}
    </div>
  )
}