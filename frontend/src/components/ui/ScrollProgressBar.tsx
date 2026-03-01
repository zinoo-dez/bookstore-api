import { motion, useScroll, useSpring } from 'framer-motion'

type ScrollProgressBarProps = {
  topClassName?: string
  widthClassName?: string
}

const ScrollProgressBar = ({
  topClassName = 'top-0',
  widthClassName = 'w-full',
}: ScrollProgressBarProps) => {
  const { scrollYProgress } = useScroll()
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    mass: 0.25,
  })

  return (
    <div className={`pointer-events-none fixed left-0 right-0 z-[70] ${topClassName}`}>
      <div className={`mx-auto h-[3px] overflow-hidden rounded-full bg-slate-200/55 dark:bg-slate-700/45 ${widthClassName}`}>
        <motion.div
          className="h-full w-full origin-left bg-[linear-gradient(90deg,#22d3ee_0%,#3b82f6_45%,#8b5cf6_100%)]"
          style={{ scaleX: progressScaleX }}
        />
      </div>
    </div>
  )
}

export default ScrollProgressBar
