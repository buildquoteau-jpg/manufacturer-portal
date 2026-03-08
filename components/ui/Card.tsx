interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}