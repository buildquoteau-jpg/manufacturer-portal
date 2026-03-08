'use client'
import { useState, useRef } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import CheckRow from '../ui/CheckRow'
import SectionLabel from '../ui/SectionLabel'
import Toggle from '../ui/Toggle'
import { BuilderDetails, SupplierDetails, RFQPayload } from '@/lib/types'

interface SendScreenProps {
  rfqPayload: Omit<RFQPayload, 'rfqId'>
  onChange: (payload: Omit<RFQPayload, 'rfqId'>) => void
  onBack: () => void
  onSend: () => void
  sending: boolean
  sendError?: string
}

export default function SendScreen({ rfqPayload, onChange, onBack, onSend, sending, sendError }: SendScreenProps) {
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef<any>(null)
  const committedRef = useRef<string>('')

  const setBuilder = (field: keyof BuilderDetails, value: string) =>
    onChange({ ...rfqPayload, builder: { ...rfqPayload.builder, [field]: value } })

  const setSupplier = (field: keyof SupplierDetails, value: string) =>
    onChange({ ...rfqPayload, supplier: { ...rfqPayload.supplier, [field]: value } })

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setVoiceError('Voice not supported in this browser. Try Chrome or Safari.')
      return
    }

    setVoiceError('')

    // Seed committed text with whatever is already in the box
    committedRef.current = rfqPayload.message

    const recognition: any = new SR()
    recognition.continuous = true
    recognition.interimResults = true  // real-time as you speak
    recognition.lang = 'en-AU'

    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          // Lock in the final word/phrase
          committedRef.current += (committedRef.current ? ' ' : '') + transcript
        } else {
          // Show live interim in real time
          interim = transcript
        }
      }
      onChange({
        ...rfqPayload,
        message: committedRef.current + (interim ? ' ' + interim : ''),
      })
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Allow microphone in your browser settings.')
      } else if (e.error !== 'aborted') {
        setVoiceError('Voice error: ' + e.error)
      }
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <SectionLabel>Your Details</SectionLabel>
        <Input label="Builder Name" value={rfqPayload.builder.builderName} onChange={v => setBuilder('builderName', v)} />
        <Input label="Company Name" value={rfqPayload.builder.company} onChange={v => setBuilder('company', v)} />
        <Input label="ABN / ACN" value={rfqPayload.builder.abn} onChange={v => setBuilder('abn', v)} />
        <Input label="Phone" value={rfqPayload.builder.phone} onChange={v => setBuilder('phone', v)} type="tel" />
        <Input label="Email" value={rfqPayload.builder.email} onChange={v => setBuilder('email', v)} type="email" />
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionLabel>Supplier Details</SectionLabel>
        <Input label="Supplier Name" value={rfqPayload.supplier.supplierName} onChange={v => setSupplier('supplierName', v)} />
        <Input label="Supplier Email" value={rfqPayload.supplier.supplierEmail} onChange={v => setSupplier('supplierEmail', v)} type="email" />
        <Input label="Account Number (if known)" value={rfqPayload.supplier.accountNumber} onChange={v => setSupplier('accountNumber', v)} />
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionLabel>Delivery</SectionLabel>
        <Toggle value={rfqPayload.delivery} onChange={v => onChange({ ...rfqPayload, delivery: v })} />
        {rfqPayload.delivery === 'delivery' && (
          <Input label="Site Address" value={rfqPayload.siteAddress || ''} onChange={v => onChange({ ...rfqPayload, siteAddress: v })} placeholder="123 Site Road, Dunsborough" />
        )}
        <Input label="Date Required" value={rfqPayload.dateRequired} onChange={v => onChange({ ...rfqPayload, dateRequired: v })} type="date" />
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionLabel>Message</SectionLabel>
        <div className="relative">
          <textarea
            value={rfqPayload.message}
            onChange={e => onChange({ ...rfqPayload, message: e.target.value })}
            placeholder="Any additional notes for the supplier..."
            rows={4}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 w-full resize-none pr-10"
          />
          <button
            type="button"
            onClick={toggleVoice}
            className={`absolute bottom-3 right-3 text-xl transition-colors ${
              listening ? 'text-red-400 animate-pulse' : 'text-gray-500 hover:text-orange-500'
            }`}
            title={listening ? 'Tap to stop' : 'Tap to dictate'}
          >
            🎤
          </button>
        </div>
        {listening && (
          <p className="text-orange-400 text-xs animate-pulse">🔴 Listening... tap mic to stop</p>
        )}
        {voiceError && (
          <p className="text-red-400 text-xs">{voiceError}</p>
        )}
      </Card>

      <Card className="flex flex-col gap-1">
        <SectionLabel>Send Options</SectionLabel>
        <CheckRow label="Send RFQ to Supplier" checked={true} onChange={() => {}} />
        <CheckRow
          label="Send a copy to myself"
          checked={rfqPayload.sendCopyToSelf}
          onChange={v => onChange({ ...rfqPayload, sendCopyToSelf: v })}
        />
      </Card>

      {sendError && (
        <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
          ⚠️ {sendError}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1 py-3">← Back</Button>
        <Button
          onClick={onSend}
          disabled={sending || !rfqPayload.supplier.supplierEmail || !rfqPayload.builder.email}
          className="flex-1 py-3"
        >
          {sending ? 'Sending...' : 'Send RFQ →'}
        </Button>
      </div>
    </div>
  )
}
