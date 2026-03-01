import { useState, useEffect } from 'react'

/**
 * Detects if user is navigating with keyboard
 * Only shows visual indicators when keyboard is actively used
 */
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    let keyboardTimeout: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only consider navigation keys
      if (['ArrowUp', 'ArrowDown', 'Tab', 'Enter', ' '].includes(e.key)) {
        setIsKeyboardUser(true)
        
        // Reset after 3 seconds of no keyboard activity
        clearTimeout(keyboardTimeout)
        keyboardTimeout = setTimeout(() => {
          setIsKeyboardUser(false)
        }, 3000)
      }
    }

    const handleMouseMove = () => {
      // User moved mouse, they're using mouse now
      setIsKeyboardUser(false)
      clearTimeout(keyboardTimeout)
    }

    const handleClick = () => {
      // User clicked, they're using mouse now
      setIsKeyboardUser(false)
      clearTimeout(keyboardTimeout)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      clearTimeout(keyboardTimeout)
    }
  }, [])

  return isKeyboardUser
}
