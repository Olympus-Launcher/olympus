import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ThemeMode } from '../config'

interface TooltipProps {
  children: ReactNode
  text: string
}

interface TooltipContextType {
  showTooltip: (text: string, e: React.MouseEvent) => void
  hideTooltip: () => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

export function useTooltip() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider')
  }
  return context
}

interface TooltipProviderProps {
  children: ReactNode
  theme: ThemeMode
}

export function TooltipProvider({ children, theme }: TooltipProviderProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const showTooltip = useCallback((text: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ 
      text, 
      x: rect.left + rect.width / 2, 
      y: rect.top 
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltip && createPortal(
        <div
          className="fixed px-3 py-1.5 rounded-md text-xs font-medium shadow-lg pointer-events-none z-[9999] animate-fade-in"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#1f2937',
            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
            transition: 'opacity 0.1s ease'
          }}
        >
          {tooltip.text}
          <div 
            className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
              borderRight: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
              borderBottom: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
            }}
          />
        </div>,
        document.body
      )}
    </TooltipContext.Provider>
  )
}

export function Tooltip({ children, text }: TooltipProps) {
  const { showTooltip, hideTooltip } = useTooltip()
  
  return (
    <div
      onMouseEnter={(e) => showTooltip(text, e)}
      onMouseLeave={hideTooltip}
    >
      {children}
    </div>
  )
}
