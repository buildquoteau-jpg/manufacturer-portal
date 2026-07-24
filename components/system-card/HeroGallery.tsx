'use client'

// Swipeable hero gallery for the System Card (Library V7).
//
// KEEP IN SYNC: this file is duplicated byte-for-byte in BuildQuote v6
// (components/library/HeroGallery.tsx) and Data Studio
// (components/system-card-renderer/HeroGallery.tsx) — the master System Card
// renderer rule. Change one, change both.
//
// Design intent: the card keeps its premium, portable-spec feel — no
// thumbnail strips or e-commerce chrome. One image per viewport with smooth
// scroll-snapping, a subtle count pill, dots, and tap-to-fullscreen.
// Cards with zero or one image render exactly the classic single-hero block.
// Plain <img> (not next/image) so the identical file also works in the
// static-package bundle; index 0 loads eagerly at high priority, the rest
// lazily as they scroll into view.

import React, { useCallback, useEffect, useRef, useState } from 'react'

export type HeroGalleryImage = {
  url: string
  og_jpg_url?: string | null
  alt: string
  caption?: string | null
}

type Props = {
  images: HeroGalleryImage[]
  // Classic single-hero fallback (also used when images is empty).
  // zoom: 1 = fit … 3 = 300%, scaled around the (posX, posY) crop point.
  fallbackHero?: { url: string | null; alt: string; posX: number; posY: number; zoom?: number | null }
  // Title block (manufacturer / name / category) pinned over the gallery.
  overlay?: React.ReactNode
  // Optional control pinned top-right (e.g. the favourite heart).
  topRight?: React.ReactNode
}

const HERO_HEIGHT = 'clamp(200px, 48vw, 300px)'
const GRADIENT = 'linear-gradient(to top, rgba(15,30,45,0.88) 0%, rgba(15,30,45,0.2) 60%, transparent 100%)'
const FALLBACK_BG = 'linear-gradient(135deg, #185D7A 0%, #0f3d52 100%)'

export function HeroGallery({ images, fallbackHero, overlay, topRight }: Props) {
  const slides = images.filter(img => img.url?.trim())
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [lightboxAt, setLightboxAt] = useState<number | null>(null)

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
    setActive(Math.min(slides.length - 1, Math.max(0, idx)))
  }, [slides.length])

  // ── Zero/one image: the classic hero block, unchanged ──
  if (slides.length <= 1) {
    const single = slides[0] ?? null
    const url = single?.url ?? fallbackHero?.url ?? null
    const posX = single ? 50 : fallbackHero?.posX ?? 50
    const posY = single ? 50 : fallbackHero?.posY ?? 50
    const zoom = single ? 1 : Math.max(1, Math.min(3, fallbackHero?.zoom ?? 1))
    return (
      <div style={{
        position: 'relative',
        height: 'clamp(180px, 42vw, 240px)',
        background: url?.trim() ? undefined : FALLBACK_BG,
        overflow: 'hidden',
      }}>
        {url?.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url.trim()}
            alt={single?.alt ?? fallbackHero?.alt ?? ''}
            fetchPriority="high"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: `${posX}% ${posY}%`,
              // Zoom around the crop point; overflow is clipped by the wrapper.
              transform: zoom > 1 ? `scale(${zoom})` : undefined,
              transformOrigin: `${posX}% ${posY}%`,
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: GRADIENT, pointerEvents: 'none' }} />
        {topRight}
        {overlay}
      </div>
    )
  }

  // ── Multi-image swipeable gallery ──
  return (
    <div style={{ position: 'relative', height: HERO_HEIGHT, overflow: 'hidden', background: '#0f1e2d' }}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        aria-label={`Image gallery, ${slides.length} images`}
        style={{
          display: 'flex', height: '100%',
          overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxAt(i)}
            aria-label={`Open image ${i + 1} of ${slides.length} fullscreen`}
            style={{
              position: 'relative', flex: '0 0 100%', height: '100%',
              scrollSnapAlign: 'center', scrollSnapStop: 'always',
              padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url.trim()}
              alt={img.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>

      {/* Bottom gradient + title overlay (never blocks swiping) */}
      <div style={{ position: 'absolute', inset: 0, background: GRADIENT, pointerEvents: 'none' }} />
      {topRight}
      {overlay}

      {/* Count pill */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
        background: 'rgba(15,30,45,0.55)', borderRadius: '20px', padding: '3px 10px',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'none',
      }}>
        {active + 1} / {slides.length}
      </div>

      {/* Dots */}
      <div style={{
        position: 'absolute', bottom: '8px', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: '5px', pointerEvents: 'none',
      }}>
        {slides.map((_, i) => (
          <span key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: i === active ? '#ffffff' : 'rgba(255,255,255,0.45)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      {lightboxAt !== null && (
        <GalleryLightbox
          slides={slides}
          startAt={lightboxAt}
          onClose={(finalIndex) => {
            setLightboxAt(null)
            // Keep the inline gallery on the image the user last viewed.
            const track = trackRef.current
            if (track && finalIndex !== active) {
              const reduced = typeof window !== 'undefined'
                && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
              track.scrollTo({ left: finalIndex * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
            }
          }}
        />
      )}
    </div>
  )
}

// ── Fullscreen lightbox ───────────────────────────────────────────────────────

function GalleryLightbox({
  slides,
  startAt,
  onClose,
}: {
  slides: HeroGalleryImage[]
  startAt: number
  onClose: (finalIndex: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [index, setIndex] = useState(startAt)
  const indexRef = useRef(startAt)
  indexRef.current = index

  const goTo = useCallback((i: number, smooth = true) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.min(slides.length - 1, Math.max(0, i))
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: clamped * track.clientWidth, behavior: smooth && !reduced ? 'smooth' : 'auto' })
  }, [slides.length])

  useEffect(() => {
    goTo(startAt, false)
    closeRef.current?.focus()
    // Lock page scroll behind the lightbox.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(indexRef.current)
      if (e.key === 'ArrowRight') goTo(indexRef.current + 1)
      if (e.key === 'ArrowLeft') goTo(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const caption = slides[index]?.caption?.trim()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery fullscreen"
      onClick={() => onClose(indexRef.current)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,15,22,0.96)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        ref={trackRef}
        onClick={e => e.stopPropagation()}
        onScroll={() => {
          const track = trackRef.current
          if (!track) return
          setIndex(Math.min(slides.length - 1, Math.max(0,
            Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))))
        }}
        style={{
          flex: 1, display: 'flex',
          overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((img, i) => (
          <div key={i} style={{
            flex: '0 0 100%', height: '100%',
            scrollSnapAlign: 'center', scrollSnapStop: 'always',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '48px 12px 64px', boxSizing: 'border-box',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url.trim()}
              alt={img.alt}
              loading={Math.abs(i - startAt) <= 1 ? 'eager' : 'lazy'}
              draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        ref={closeRef}
        type="button"
        onClick={e => { e.stopPropagation(); onClose(indexRef.current) }}
        aria-label="Close fullscreen gallery"
        style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.5)',
          color: '#fff', cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3L13 13M13 3L3 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Counter + caption */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: '16px', left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none',
        }}
      >
        {caption && (
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '6px', padding: '0 24px' }}>
            {caption}
          </div>
        )}
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
          {index + 1} / {slides.length}
        </div>
      </div>

      {/* Desktop arrows */}
      {index > 0 && (
        <LightboxArrow side="left" onClick={e => { e.stopPropagation(); goTo(indexRef.current - 1) }} />
      )}
      {index < slides.length - 1 && (
        <LightboxArrow side="right" onClick={e => { e.stopPropagation(); goTo(indexRef.current + 1) }} />
      )}
    </div>
  )
}

function LightboxArrow({ side, onClick }: { side: 'left' | 'right'; onClick: React.MouseEventHandler }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [side]: '10px',
        width: '42px', height: '42px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.5)',
        cursor: 'pointer',
      } as React.CSSProperties}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: side === 'left' ? 'rotate(180deg)' : undefined }}>
        <path d="M6 3L11 8L6 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
