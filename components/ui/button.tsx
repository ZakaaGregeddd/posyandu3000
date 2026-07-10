import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
    
    let variantStyles = "";
    switch (variant) {
      case 'default':
        variantStyles = "bg-tertiary text-white hover:bg-[#8b224a] shadow-sm";
        break;
      case 'destructive':
        variantStyles = "bg-error text-white hover:bg-[#9d1414] shadow-sm";
        break;
      case 'outline':
        variantStyles = "border border-outline-variant bg-transparent text-foreground hover:bg-secondary-fixed hover:border-transparent";
        break;
      case 'secondary':
        variantStyles = "bg-brand-secondary text-brand-interactive hover:opacity-90 shadow-sm";
        break;
      case 'ghost':
        variantStyles = "text-foreground hover:bg-secondary-fixed";
        break;
      case 'link':
        variantStyles = "text-brand-interactive underline-offset-4 hover:underline bg-transparent";
        break;
    }
    
    let sizeStyles = "";
    switch (size) {
      case 'default':
        sizeStyles = "h-11 px-6 py-2";
        break;
      case 'sm':
        sizeStyles = "h-9 px-4 text-xs";
        break;
      case 'lg':
        sizeStyles = "h-12 px-8 py-3 text-base";
        break;
      case 'icon':
        sizeStyles = "h-10 w-10";
        break;
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
