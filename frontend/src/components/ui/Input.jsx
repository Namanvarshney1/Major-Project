import React from 'react';
export const Input = ({ label, error, helperText, className = '', id, ...props }) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="flex flex-col gap-1.5 w-full">
      {label && (<label htmlFor={inputId} className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
          {label}
        </label>)}
      <input id={inputId} className={`w-full px-3.5 py-2 bg-[#ffffff] border rounded-lg text-sm text-[#1b1c17] placeholder:text-[#767871] transition-all focus:outline-none ${error
            ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
            : 'border-[#c6c7c0] focus:border-[#1b1c17] focus:ring-1 focus:ring-[#c6f26a]'} ${className}`} {...props}/>
      {error && <span className="text-xs text-[#ba1a1a] font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#767871]">{helperText}</span>}
    </div>);
};
