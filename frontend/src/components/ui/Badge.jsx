import React from 'react';
export const Badge = ({ variant = 'gray', size = 'md', className = '', children, ...props }) => {
    const baseStyles = 'inline-flex items-center font-mono font-medium tracking-tight rounded uppercase select-none';
    const sizeStyles = {
        sm: 'text-[10px] px-1.5 py-0.5 gap-1',
        md: 'text-xs px-2 py-0.5 gap-1.5',
    };
    const variantStyles = {
        lime: 'bg-[#c6f26a] text-[#141f00] font-semibold',
        secondary: 'bg-[#c6f26a] text-[#141f00] font-semibold',
        gray: 'bg-[#f0eee5] text-[#1b1c17]',
        dark: 'bg-[#1a1c18] text-[#dfe4d8]',
        success: 'bg-[#f0eee5] text-[#4b6700] border border-[#4b6700]/30',
        warning: 'bg-[#fff5e6] text-[#c68a35] border border-[#c68a35]/40',
        error: 'bg-[#ffdad6] text-[#ba1a1a]',
        destructive: 'bg-[#ffdad6] text-[#ba1a1a]',
        outline: 'bg-transparent text-[#454742] border border-[#c6c7c0]',
    };
    return (<span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>);
};
