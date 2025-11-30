'use client'

import React, { forwardRef, ElementType } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, ChevronRight } from 'lucide-react'

export interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'glow' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  as?: ElementType
  href?: string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    onClick,
    as: Component = 'button',
    href,
  }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
      default: 'btn shadow-primary',
      primary: 'btn shadow-primary',
      secondary: 'btn border border-border',
      outline: 'btn border border-input',
      ghost: 'btn',
      glow: 'btn bg-size-200 animate-gradient shadow-glow hover:shadow-glow-lg',
      destructive: 'btn',
    }

    const sizes = {
      sm: 'h-10 px-4 text-sm rounded-lg',
      md: 'h-12 px-6 text-sm rounded-xl',
      lg: 'h-14 px-8 text-base rounded-xl',
      xl: 'h-16 px-10 text-lg rounded-2xl',
    }

    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            background: 'var(--wave-azul)',
            color: 'white',
            border: '1px solid var(--wave-azul-dark)',
          }
        case 'secondary':
          return {
            background: 'var(--wave-glass-bg)',
            color: 'var(--wave-text-primary)',
            border: '1px solid var(--wave-glass-border)',
          }
        case 'destructive':
          return {
            background: 'var(--wave-error)',
            color: 'white',
            border: '1px solid var(--wave-error)',
          }
        case 'glow':
          return {
            background: 'linear-gradient(135deg, var(--wave-azul), var(--wave-deep-blue))',
            color: 'white',
            border: 'none',
          }
        default:
          return {
            background: 'var(--wave-azul)',
            color: 'white',
            border: '1px solid var(--wave-azul-dark)',
          }
      }
    }

    const buttonStyles = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      loading && 'cursor-wait',
      className
    )

    const dynamicStyles = getVariantStyles()

    const content = (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        {!loading && variant === 'glow' && <ChevronRight className="h-4 w-4" />}
      </>
    )

    const buttonProps = {
      className: buttonStyles,
      disabled: disabled || loading,
      onClick,
      style: dynamicStyles,
    }

    return (
      <Component {...buttonProps}>
        {content}
      </Component>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export default Button