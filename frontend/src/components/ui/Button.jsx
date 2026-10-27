import React from 'react';
export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';
    const sizeStyles = {
        sm: 'text-xs px-2.5 py-1.5 rounded gap-1.5',
        md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
        lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 font-semibold',
    };
    const variantStyles = {
        primary: 'bg-[#c6f26a] hover:bg-[#abd551] text-[#141f00] font-semibold border border-transparent shadow-xs',
        secondary: 'bg-[#ffffff] hover:bg-[#f6f4eb] text-[#1b1c17] border border-[#c6c7c0] hover:border-[#767871]',
        outline: 'bg-transparent hover:bg-[#f0eee5] text-[#1b1c17] border border-[#c6c7c0] hover:border-[#767871]',
        ghost: 'bg-transparent hover:bg-[#f0eee5] text-[#454742] hover:text-[#1b1c17]',
        destructive: 'bg-transparent hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]',
        dark: 'bg-[#1b1c17] hover:bg-[#30312b] text-white font-medium border border-transparent',
    };
    return (<button className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>);
};
