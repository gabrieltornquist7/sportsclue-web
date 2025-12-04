'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import Card from './Card'

// Particle component for burst effects
function Particle({ delay, duration, angle, distance, color, size }) {
  const radian = (angle * Math.PI) / 180
  const x = Math.cos(radian) * distance
  const y = Math.sin(radian) * distance

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: x,
        y: y,
        scale: [1, 1.5, 0.5]
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut"
      }}
    />
  )
}

// Generate particles for burst effect
function ParticleBurst({ count, colors, minSize, maxSize, minDistance, maxDistance }) {
  const particles = []

  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i + Math.random() * 20 - 10
    const distance = minDistance + Math.random() * (maxDistance - minDistance)
    const size = minSize + Math.random() * (maxSize - minSize)
    const color = colors[Math.floor(Math.random() * colors.length)]
    const delay = Math.random() * 0.2
    const duration = 0.8 + Math.random() * 0.4

    particles.push(
      <Particle
        key={i}
        angle={angle}
        distance={distance}
        size={size}
        color={color}
        delay={delay}
        duration={duration}
      />
    )
  }

  return <div className="absolute inset-0 flex items-center justify-center">{particles}</div>
}

// Floating sparkle component
function FloatingSparkle({ delay, x, y }) {
  return (
    <motion.div
      className="absolute text-yellow-300"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360]
      }}
      transition={{
        duration: 1.5,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
    >
      <Sparkles className="w-4 h-4" />
    </motion.div>
  )
}

// Get rarity-based configuration
function getRarityConfig(rarity) {
  const configs = {
    mythic: {
      boxGradient: 'from-yellow-400 via-orange-500 to-red-500',
      boxBorder: 'border-yellow-300',
      boxShadow: 'shadow-yellow-500/50',
      glowColor: 'rgba(250, 204, 21, 0.8)',
      particleColors: ['#fbbf24', '#f59e0b', '#ef4444', '#fcd34d', '#fef3c7'],
      burstIntensity: 1.5,
      shakeDuration: 2.0,
      shakeIntensity: 12,
      particleCount: 40,
    },
    legendary: {
      boxGradient: 'from-yellow-500 via-amber-500 to-yellow-600',
      boxBorder: 'border-yellow-400',
      boxShadow: 'shadow-yellow-500/40',
      glowColor: 'rgba(234, 179, 8, 0.7)',
      particleColors: ['#eab308', '#fbbf24', '#fcd34d', '#fef08a'],
      burstIntensity: 1.3,
      shakeDuration: 1.8,
      shakeIntensity: 10,
      particleCount: 32,
    },
    epic: {
      boxGradient: 'from-purple-500 via-violet-500 to-purple-600',
      boxBorder: 'border-purple-400',
      boxShadow: 'shadow-purple-500/40',
      glowColor: 'rgba(168, 85, 247, 0.7)',
      particleColors: ['#a855f7', '#8b5cf6', '#c084fc', '#d8b4fe'],
      burstIntensity: 1.2,
      shakeDuration: 1.5,
      shakeIntensity: 8,
      particleCount: 28,
    },
    rare: {
      boxGradient: 'from-blue-500 via-cyan-500 to-blue-600',
      boxBorder: 'border-blue-400',
      boxShadow: 'shadow-blue-500/40',
      glowColor: 'rgba(59, 130, 246, 0.6)',
      particleColors: ['#3b82f6', '#06b6d4', '#60a5fa', '#93c5fd'],
      burstIntensity: 1.0,
      shakeDuration: 1.3,
      shakeIntensity: 6,
      particleCount: 24,
    },
    common: {
      boxGradient: 'from-zinc-500 via-slate-500 to-zinc-600',
      boxBorder: 'border-zinc-400',
      boxShadow: 'shadow-zinc-500/30',
      glowColor: 'rgba(161, 161, 170, 0.5)',
      particleColors: ['#a1a1aa', '#71717a', '#d4d4d8', '#e4e4e7'],
      burstIntensity: 0.8,
      shakeDuration: 1.0,
      shakeIntensity: 4,
      particleCount: 16,
    },
  }

  return configs[rarity] || configs.common
}

// Get box type configuration
function getBoxTypeConfig(boxType) {
  const configs = {
    legendary_box: {
      emoji: '👑',
      name: 'Legendary Box',
      baseGradient: 'from-yellow-600 via-amber-500 to-orange-500',
      accentColor: 'yellow',
    },
    pro_box: {
      emoji: '⭐',
      name: 'Pro Box',
      baseGradient: 'from-purple-600 via-violet-500 to-purple-500',
      accentColor: 'purple',
    },
    standard_box: {
      emoji: '📦',
      name: 'Standard Box',
      baseGradient: 'from-blue-600 via-cyan-500 to-blue-500',
      accentColor: 'blue',
    },
  }

  return configs[boxType] || configs.standard_box
}

export default function BoxOpeningAnimation({
  isOpen,
  boxType,
  card,
  onClose,
  onComplete
}) {
  const [phase, setPhase] = useState('idle') // idle, box, shaking, opening, revealing, complete
  const [showSkip, setShowSkip] = useState(false)

  const rarityConfig = card ? getRarityConfig(card.rarity || 'common') : getRarityConfig('common')
  const boxConfig = getBoxTypeConfig(boxType)

  // Animation sequence controller
  useEffect(() => {
    if (!isOpen || !card) {
      setPhase('idle')
      setShowSkip(false)
      return
    }

    // Start animation sequence
    setPhase('box')
    setShowSkip(true)

    const timers = []

    // Phase 1: Box appears (already showing)
    // Phase 2: Shaking starts
    timers.push(setTimeout(() => setPhase('shaking'), 300))

    // Phase 3: Box opens
    timers.push(setTimeout(() => setPhase('opening'), 300 + rarityConfig.shakeDuration * 1000))

    // Phase 4: Card reveals
    timers.push(setTimeout(() => setPhase('revealing'), 300 + rarityConfig.shakeDuration * 1000 + 500))

    // Phase 5: Complete
    timers.push(setTimeout(() => {
      setPhase('complete')
      setShowSkip(false)
    }, 300 + rarityConfig.shakeDuration * 1000 + 500 + 1200))

    return () => timers.forEach(t => clearTimeout(t))
  }, [isOpen, card, rarityConfig.shakeDuration])

  // Skip to end
  const handleSkip = useCallback(() => {
    setPhase('complete')
    setShowSkip(false)
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    setPhase('idle')
    if (onComplete) onComplete()
    if (onClose) onClose()
  }, [onClose, onComplete])

  if (!isOpen || !card) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with vignette */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
        />

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)'
          }}
        />

        {/* Ambient glow effect based on rarity */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 'shaking' || phase === 'opening' ? [0.3, 0.6, 0.3] : 0.2
          }}
          transition={{ duration: 0.5, repeat: phase === 'shaking' ? Infinity : 0 }}
          style={{
            background: `radial-gradient(circle at center, ${rarityConfig.glowColor} 0%, transparent 50%)`
          }}
        />

        {/* Floating sparkles during shake */}
        {(phase === 'shaking' || phase === 'opening') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <FloatingSparkle
                key={i}
                delay={i * 0.1}
                x={20 + Math.random() * 60}
                y={20 + Math.random() * 60}
              />
            ))}
          </div>
        )}

        {/* Skip button */}
        <AnimatePresence>
          {showSkip && phase !== 'complete' && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={handleSkip}
              className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
            >
              <span className="text-sm font-medium">Skip</span>
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main animation container */}
        <div className="relative w-full max-w-md mx-4 flex items-center justify-center" style={{ minHeight: '400px' }}>

          {/* Box - visible during box, shaking, and opening phases */}
          <AnimatePresence>
            {(phase === 'box' || phase === 'shaking' || phase === 'opening') && (
              <motion.div
                className="absolute"
                initial={{ scale: 0, rotateY: -180 }}
                animate={{
                  scale: phase === 'opening' ? [1, 1.2, 0] : 1,
                  rotateY: 0,
                  x: phase === 'shaking'
                    ? [0, -rarityConfig.shakeIntensity, rarityConfig.shakeIntensity, -rarityConfig.shakeIntensity, rarityConfig.shakeIntensity, 0]
                    : 0,
                  y: phase === 'shaking'
                    ? [0, -rarityConfig.shakeIntensity/2, rarityConfig.shakeIntensity/2, -rarityConfig.shakeIntensity/2, 0]
                    : 0,
                  rotate: phase === 'shaking'
                    ? [0, -3, 3, -3, 3, 0]
                    : 0,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  scale: { duration: phase === 'opening' ? 0.5 : 0.5, ease: "backOut" },
                  rotateY: { duration: 0.5, ease: "backOut" },
                  x: { duration: 0.15, repeat: phase === 'shaking' ? Infinity : 0, ease: "easeInOut" },
                  y: { duration: 0.2, repeat: phase === 'shaking' ? Infinity : 0, ease: "easeInOut" },
                  rotate: { duration: 0.1, repeat: phase === 'shaking' ? Infinity : 0, ease: "easeInOut" },
                }}
              >
                {/* Box container */}
                <div className="relative">
                  {/* Box glow */}
                  <motion.div
                    className="absolute -inset-8 rounded-3xl blur-2xl"
                    animate={{
                      opacity: phase === 'shaking' ? [0.4, 0.8, 0.4] : 0.3,
                      scale: phase === 'shaking' ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.5, repeat: phase === 'shaking' ? Infinity : 0 }}
                    style={{ backgroundColor: rarityConfig.glowColor }}
                  />

                  {/* 3D Box */}
                  <div
                    className={`relative w-48 h-48 rounded-2xl bg-gradient-to-br ${boxConfig.baseGradient} border-4 ${rarityConfig.boxBorder} shadow-2xl ${rarityConfig.boxShadow}`}
                    style={{
                      transform: 'perspective(1000px) rotateX(10deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Box lid */}
                    <motion.div
                      className={`absolute -top-4 left-0 right-0 h-8 rounded-t-xl bg-gradient-to-b ${boxConfig.baseGradient} border-4 border-b-0 ${rarityConfig.boxBorder}`}
                      animate={{
                        rotateX: phase === 'opening' ? -120 : 0,
                        y: phase === 'opening' ? -20 : 0,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{
                        transformOrigin: 'bottom',
                        transformStyle: 'preserve-3d'
                      }}
                    />

                    {/* Box emoji/icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        className="text-7xl filter drop-shadow-lg"
                        animate={{
                          scale: phase === 'shaking' ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.3, repeat: phase === 'shaking' ? Infinity : 0 }}
                      >
                        {boxConfig.emoji}
                      </motion.span>
                    </div>

                    {/* Inner glow during opening */}
                    {phase === 'opening' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.5] }}
                        transition={{ duration: 0.5 }}
                        style={{
                          background: `radial-gradient(circle at center top, ${rarityConfig.glowColor} 0%, transparent 70%)`
                        }}
                      />
                    )}

                    {/* Box decorative lines */}
                    <div className="absolute inset-4 border-2 border-white/20 rounded-xl" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particle burst on opening */}
          <AnimatePresence>
            {phase === 'opening' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute"
              >
                <ParticleBurst
                  count={rarityConfig.particleCount}
                  colors={rarityConfig.particleColors}
                  minSize={6}
                  maxSize={14 * rarityConfig.burstIntensity}
                  minDistance={100}
                  maxDistance={250 * rarityConfig.burstIntensity}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Light burst effect */}
          <AnimatePresence>
            {phase === 'opening' && (
              <motion.div
                className="absolute w-full h-full"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div
                  className="w-full h-full rounded-full blur-3xl"
                  style={{ backgroundColor: rarityConfig.glowColor }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screen flash */}
          <AnimatePresence>
            {phase === 'opening' && (
              <motion.div
                className="fixed inset-0 bg-white pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* Card reveal */}
          <AnimatePresence>
            {(phase === 'revealing' || phase === 'complete') && (
              <motion.div
                className="relative z-10"
                initial={{ scale: 0, rotateY: 180, y: 100 }}
                animate={{
                  scale: 1,
                  rotateY: 0,
                  y: 0
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
                  rotateY: { duration: 0.6 }
                }}
              >
                {/* Card glow */}
                <motion.div
                  className="absolute -inset-6 rounded-2xl blur-xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ backgroundColor: rarityConfig.glowColor }}
                />

                {/* Card container */}
                <div className="relative w-56">
                  <Card
                    card={card}
                    mode="vault"
                    size="normal"
                  />
                </div>

                {/* Rarity sparkles around card */}
                {(card.rarity === 'legendary' || card.rarity === 'mythic' || card.rarity === 'epic') && (
                  <div className="absolute -inset-8 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${10 + (i % 4) * 25}%`,
                          top: `${10 + Math.floor(i / 4) * 80}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.2,
                          repeat: Infinity,
                        }}
                      >
                        <Sparkles className="w-5 h-5" style={{ color: rarityConfig.particleColors[0] }} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card info and action button */}
          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div
                className="absolute -bottom-32 left-0 right-0 flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Rarity announcement */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`px-6 py-2 rounded-full border-2 ${
                    card.rarity === 'mythic' ? 'bg-yellow-900/40 border-yellow-300 text-yellow-300' :
                    card.rarity === 'legendary' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' :
                    card.rarity === 'epic' ? 'bg-purple-900/30 border-purple-500 text-purple-400' :
                    card.rarity === 'rare' ? 'bg-blue-900/30 border-blue-500 text-blue-400' :
                    'bg-zinc-900/30 border-zinc-500 text-zinc-400'
                  }`}
                >
                  <span className="font-bold uppercase tracking-wider text-lg">
                    {card.rarity}
                  </span>
                </motion.div>

                {/* Card name */}
                <h2 className="text-2xl font-bold text-white text-center">
                  {card.name}
                </h2>

                {/* Serial number */}
                <p className="text-zinc-400 text-sm">
                  #{card.serialNumber || card.serial_number}
                  {(card.maxMints || card.max_mints) !== null
                    ? ` of ${card.maxMints || card.max_mints}`
                    : ' of ∞'}
                </p>

                {/* Action button */}
                <motion.button
                  onClick={handleClose}
                  className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-blue-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add to Collection
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
