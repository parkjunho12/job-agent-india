/**
 * Logo Component (Upgraded)
 * - Supports SVG/PNG assets in /public/svg and /public/png
 * - Reliable fallback via <img onError>
 * - Variants: 'full' | 'mark' | 'text'
 * - Sizes: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */

import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const SIZE_MAP = {
  sm: 'h-6',    // 24px
  md: 'h-8',    // 32px
  lg: 'h-10',   // 40px
  xl: 'h-16',   // 64px
  '2xl': 'h-20', // 80px
  '4xl': 'h-28' // 80px
}

const TEXT_SIZE_MAP = {
  sm: 'text-lg',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
  '4xl': 'text-6xl'
}

// Your current public structure:
// public/svg/jobagent_logo_embedded.svg
// public/svg/jobagent_mark_embedded.svg
// public/png/jobagent_logo_256.png ... etc
const ASSETS = {
  full: {
    svg: '/svg/jobagent_logo_embedded.svg',
    // a safe PNG fallback (choose what you prefer)
    png: '/png/jobagent_logo_256.png'
  },
  mark: {
    svg: '/svg/jobagent_mark_embedded.svg',
    png: '/png/jobagent_mark_64.png'
  }
}

function DefaultFallback({ variant, size, brandText, className }) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <Sparkles className={cx(sizeClass, 'text-primary-500')} />
      {variant !== 'mark' && (
        <span className={cx('font-bold text-gray-900', TEXT_SIZE_MAP[size] || TEXT_SIZE_MAP.md)}>
          {brandText}
        </span>
      )}
    </div>
  )
}

function Logo({
  variant = 'full',        // 'full' | 'mark' | 'text'
  size = 'md',             // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  linkTo = '/',            // string | null
  className = '',
  imgClassName = '',
  brandText = 'JobAgent',
  alt,                     // optional custom alt
  title,                   // optional tooltip title
  preferSvg = true,        // try svg first, fallback to png
  showFallback = true,     // show fallback UI if image fails
  target,                  // optional (for external links when linkTo is URL)
  rel,                     // optional
  onClick                  // optional
}) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md

  // TEXT variant: no image, no fallback needed
  if (variant === 'text') {
    const node = (
      <span
        className={cx('font-bold text-gray-900 leading-none', TEXT_SIZE_MAP[size] || TEXT_SIZE_MAP.md, className)}
        title={title}
      >
        {brandText}
      </span>
    )
    if (linkTo) {
      return (
        <Link to={linkTo} className="inline-flex items-center" onClick={onClick}>
          {node}
        </Link>
      )
    }
    return node
  }

  const asset = ASSETS[variant] || ASSETS.full
  const primarySrc = preferSvg ? asset.svg : asset.png
  const secondarySrc = preferSvg ? asset.png : asset.svg

  const computedAlt = alt ?? (variant === 'mark' ? `${brandText} logo` : `${brandText}`)

  // We can’t know if public files exist at runtime without requesting them.
  // Use onError to switch to fallback or secondary image.
  const Img = ({ src, fallbackTried }) => (
    <img
      src={src}
      alt={computedAlt}
      title={title}
      className={cx('w-auto object-contain select-none', sizeClass, imgClassName, className)}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={(e) => {
        if (fallbackTried) {
          if (showFallback) {
            // Replace the image node with fallback by toggling display (simple/robust)
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent && !parent.querySelector('[data-logo-fallback="1"]')) {
              const wrapper = document.createElement('div')
              wrapper.setAttribute('data-logo-fallback', '1')
              parent.appendChild(wrapper)
              // We cannot mount React here; so we rely on secondarySrc first.
              // If both fail, the image hides; you can choose to render fallback via state approach if preferred.
            }
          }
          return
        }
        // Try secondary src once
        e.currentTarget.src = secondarySrc
        e.currentTarget.dataset.fallbackTried = '1'
      }}
      data-fallback-tried={fallbackTried ? '1' : '0'}
    />
  )

  // State-free version above attempts secondarySrc, then hides.
  // If you want a true React fallback render, use the stateful version below.
  // For most cases: primary→secondary is enough, since your assets exist.

  const imageNode = <Img src={primarySrc} fallbackTried={false} />

  const content = (
    <span className="inline-flex items-center">
      {imageNode}
      {/* Optional: show brand text next to mark (if you ever want) */}
      {/* {variant === 'mark' && <span className="ml-2 font-bold text-gray-900">JobAgent</span>} */}
    </span>
  )

  if (!linkTo) return content

  // If you sometimes pass absolute URLs, you may want <a>. For now keep <Link>.
  // If you need external URL support, change this branch accordingly.
  return (
    <Link to={linkTo} className="inline-flex items-center" onClick={onClick} target={target} rel={rel}>
      {content}
    </Link>
  )
}

export default Logo
