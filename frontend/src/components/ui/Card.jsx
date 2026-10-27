import React from 'react';
export const Card = ({ className = '', children, ...props }) => {
    return (<div className={`bg-[#ffffff] border border-[#c6c7c0] rounded-xl p-6 shadow-xs ${className}`} {...props}>
      {children}
    </div>);
};
export const CardHeader = ({ className = '', children, ...props }) => (<div className={`border-b border-[#c6c7c0]/40 pb-3 mb-4 ${className}`} {...props}>
    {children}
  </div>);
export const CardTitle = ({ className = '', children, ...props }) => (<h3 className={`text-base font-bold tracking-tight text-[#1b1c17] ${className}`} {...props}>
    {children}
  </h3>);
export const CardContent = ({ className = '', children, ...props }) => (<div className={`text-xs text-[#454742] ${className}`} {...props}>
    {children}
  </div>);
