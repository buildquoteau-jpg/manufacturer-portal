import Link from 'next/link'

export const metadata = {
  title: 'Legal — BuildQuote Manufacturer Portal',
}

const sections = [
  { id: 'terms',      label: 'Terms of Use' },
  { id: 'privacy',    label: 'Privacy Policy' },
  { id: 'disclaimer', label: 'Disclaimer' },
]

export default function LegalPage() {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-page">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-text-faint text-xs hover:text-text-secondary transition-colors mb-10">
          ← Back to portal home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-brand mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-text-primary mb-3">Terms, Privacy &amp; Disclaimer</h1>
          <p className="text-text-faint text-sm">Last updated: May 2026 · BuildQuote Pty Ltd · ABN [pending]</p>
        </div>

        {/* Jump links */}
        <div className="flex flex-wrap gap-3 mb-12">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-4 py-1.5 bg-surface border border-border rounded-full text-sm text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>

        <div className="space-y-16">

          {/* ── Terms of Use ─────────────────────────────────────────── */}
          <section id="terms">
            <h2 className="text-xl font-bold text-text-primary mb-6 pb-3 border-b border-border">
              Terms of Use
            </h2>
            <div className="space-y-5 text-sm text-text-secondary leading-relaxed">

              <div>
                <h3 className="font-semibold text-text-primary mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the BuildQuote Manufacturer Portal
                  (<strong>mfp.buildquote.com.au</strong>), you agree to be bound by these Terms of Use.
                  If you do not agree, please do not use this portal. These terms apply to all users,
                  including building materials suppliers and product manufacturers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">2. Portal Access</h3>
                <p>
                  Access to the portal is provided by BuildQuote Pty Ltd (<strong>"BuildQuote"</strong>)
                  to approved suppliers and manufacturers only. Portal accounts are not transferable.
                  You are responsible for keeping your login credentials secure and for all activity
                  that occurs under your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">3. Permitted Use</h3>
                <p>
                  You may use the portal to manage your product data, widget configurations and supplier
                  or manufacturer profile as permitted by BuildQuote. You must not use the portal to:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-text-faint">
                  <li>Upload or distribute false, misleading or infringing content</li>
                  <li>Attempt to access accounts or data that do not belong to you</li>
                  <li>Reverse engineer, scrape or copy portal functionality without written consent</li>
                  <li>Violate any applicable Australian law or regulation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">4. Product Data Accuracy</h3>
                <p>
                  You are responsible for ensuring that any product specifications, pricing, images and
                  other data you submit or verify through the portal are accurate and up to date.
                  BuildQuote is not liable for errors arising from inaccurate data you provide.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">5. Intellectual Property</h3>
                <p>
                  All portal software, design, content and trademarks are the property of BuildQuote
                  or its licensors. Product data, logos and catalogue content uploaded by you remain
                  your property, but you grant BuildQuote a licence to display and use that content
                  within the platform and on buildquote.com.au for the purpose of promoting your products
                  to trade customers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">6. Suspension &amp; Termination</h3>
                <p>
                  BuildQuote may suspend or terminate your portal access at any time if you breach
                  these terms, or for any other reason at our discretion, with or without notice.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">7. Changes to Terms</h3>
                <p>
                  We may update these terms at any time. Continued use of the portal after changes
                  are posted constitutes acceptance of the revised terms.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">8. Governing Law</h3>
                <p>
                  These terms are governed by the laws of Western Australia, Australia. Any disputes
                  are subject to the exclusive jurisdiction of the courts of Western Australia.
                </p>
              </div>

            </div>
          </section>

          {/* ── Privacy Policy ───────────────────────────────────────── */}
          <section id="privacy">
            <h2 className="text-xl font-bold text-text-primary mb-6 pb-3 border-b border-border">
              Privacy Policy
            </h2>
            <div className="space-y-5 text-sm text-text-secondary leading-relaxed">

              <div>
                <h3 className="font-semibold text-text-primary mb-2">1. Who We Are</h3>
                <p>
                  BuildQuote Pty Ltd operates the Manufacturer Portal at mfp.buildquote.com.au.
                  We are committed to protecting the privacy of all portal users in accordance with
                  the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">2. Information We Collect</h3>
                <p>We collect and store the following information:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-text-faint">
                  <li>Account information: name, business name, email address, password (encrypted)</li>
                  <li>Business information: ABN, address, website, phone number</li>
                  <li>Product data: specifications, images, pricing and other catalogue content you upload</li>
                  <li>Usage data: pages visited, features used, login timestamps</li>
                  <li>Communications: emails or messages sent through the platform</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">3. How We Use Your Information</h3>
                <p>We use your information to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-text-faint">
                  <li>Provide and operate the portal and its features</li>
                  <li>Display your products to trade customers on buildquote.com.au</li>
                  <li>Send account-related communications (password resets, portal updates)</li>
                  <li>Improve the platform and diagnose technical issues</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">4. Storage &amp; Security</h3>
                <p>
                  Your data is stored securely using Supabase (PostgreSQL), hosted on infrastructure
                  within the AWS ap-southeast-2 (Sydney) region. We use industry-standard encryption
                  in transit (TLS) and at rest. We do not store plain-text passwords.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">5. Sharing of Information</h3>
                <p>
                  We do not sell your personal information. We may share data with trusted third-party
                  service providers (hosting, email, analytics) solely to operate the platform. These
                  providers are bound by confidentiality obligations. We will disclose information
                  if required by law.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">6. Your Rights</h3>
                <p>
                  You may request access to, correction of, or deletion of your personal information
                  at any time by contacting us at{' '}
                  <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">
                    hello@buildquote.com.au
                  </a>. We will respond within 30 days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">7. Cookies</h3>
                <p>
                  We use session cookies to maintain your login state. These are essential to portal
                  functionality. We do not use tracking or advertising cookies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">8. Contact</h3>
                <p>
                  For privacy enquiries, contact our Privacy Officer at{' '}
                  <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">
                    hello@buildquote.com.au
                  </a>.
                </p>
              </div>

            </div>
          </section>

          {/* ── Disclaimer ───────────────────────────────────────────── */}
          <section id="disclaimer">
            <h2 className="text-xl font-bold text-text-primary mb-6 pb-3 border-b border-border">
              Disclaimer
            </h2>
            <div className="space-y-5 text-sm text-text-secondary leading-relaxed">

              <div>
                <h3 className="font-semibold text-text-primary mb-2">AI-Extracted Product Data</h3>
                <p>
                  Some product system cards and specifications displayed in this portal have been
                  compiled using artificial intelligence tools applied to publicly available manufacturer
                  catalogues and technical documents. While we take care to ensure accuracy, AI-extracted
                  data may contain errors, omissions or outdated information.
                </p>
                <p className="mt-2">
                  <strong className="text-warning">Always verify product specifications, dimensions,
                  compatibility and installation requirements directly with the manufacturer before
                  use in any project.</strong> BuildQuote accepts no liability for decisions made
                  based on unverified portal data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">No Warranty</h3>
                <p>
                  This portal is provided "as is" without any warranty, express or implied. BuildQuote
                  does not warrant that the portal will be uninterrupted, error-free or free from
                  viruses or other harmful components. To the fullest extent permitted by Australian law,
                  BuildQuote disclaims all warranties relating to the portal and its content.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by law, BuildQuote's liability to any user for any
                  claim arising from use of the portal is limited to the amount paid by that user to
                  BuildQuote in the 12 months preceding the claim (or $100 if no amount was paid).
                  BuildQuote is not liable for any indirect, consequential, special or incidental
                  damages, including loss of profit, data or business opportunity.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">Third-Party Links</h3>
                <p>
                  The portal may contain links to external manufacturer and supplier websites.
                  BuildQuote is not responsible for the content, accuracy or privacy practices
                  of any third-party site.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">Pricing Information</h3>
                <p>
                  Any pricing information displayed through the portal or on buildquote.com.au is
                  indicative only and subject to change without notice. Pricing is not an offer and
                  does not constitute a binding quotation. Formal quotations must be obtained directly
                  from the relevant supplier or via the BuildQuote RFQ process.
                </p>
              </div>

            </div>
          </section>

        </div>

        {/* Footer contact */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-text-faint text-xs">
            Questions about these policies?{' '}
            <a href="mailto:hello@buildquote.com.au" className="text-brand hover:underline">
              Contact BuildQuote
            </a>
          </p>
          <Link href="/" className="inline-block mt-4 text-xs text-text-faint hover:text-text-secondary transition-colors">
            ← Back to portal home
          </Link>
        </div>

      </div>
    </div>
  )
}
