
import React from 'react';

interface IconProps {
  className?: string;
}

// A simplified money bag icon
const MoneyBagIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m14.25 6H6.75M12 18V5.25A2.25 2.25 0 0114.25 3h1.5A2.25 2.25 0 0118 5.25V9M7.5 18v-3.75m0 0A2.25 2.25 0 019.75 12h4.5a2.25 2.25 0 012.25 2.25V18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.008v.008H12v-.008z" />
 </svg>
);

export default MoneyBagIcon;
