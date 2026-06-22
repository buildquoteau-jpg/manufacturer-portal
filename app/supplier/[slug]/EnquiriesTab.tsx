import { RfqEnquiry, formatDate } from './shared'

export function EnquiriesTab({ enquiries }: { enquiries: RfqEnquiry[] }) {
  return (
    <div>
      <p className="text-text-faint text-sm mb-5">
        Enquiries submitted through your product widgets. Reply directly by email.
      </p>

      {enquiries.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-faint text-sm">No enquiries yet.</p>
          <p className="text-text-faint text-xs mt-1">They'll appear here when visitors submit a request via your widget.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(enq => (
            <div key={enq.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-text-primary text-sm">{enq.name}</p>
                  <p className="text-text-faint text-xs mt-0.5">
                    {enq.email}{enq.phone ? ` · ${enq.phone}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {enq.product_code && (
                    <span className="text-xs bg-brand-subtle text-brand-bright px-2.5 py-1 rounded-full font-medium">
                      {enq.product_code}
                    </span>
                  )}
                  <p className="text-text-faint text-xs mt-1">{formatDate(enq.created_at)}</p>
                </div>
              </div>
              {enq.message && (
                <p className="text-text-secondary text-sm leading-relaxed border-t border-border-subtle pt-3 mb-3">
                  {enq.message}
                </p>
              )}
              <a
                href={`mailto:${enq.email}?subject=Re: ${encodeURIComponent(enq.system_name || 'product enquiry')}&body=${encodeURIComponent(`Hi ${enq.name},\n\nThank you for your enquiry about ${enq.system_name || 'our products'}.\n\n`)}`}
                className="inline-block text-xs px-3 py-1.5 bg-ui hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-medium transition-colors"
              >
                Reply by email →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
