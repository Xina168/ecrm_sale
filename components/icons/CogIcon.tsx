import React from 'react';

interface IconProps {
  className?: string;
}

const CogIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m0 0V3.75m0 16.5V12m0 0V3.75m0 16.5V12m0-8.25L12 12m0 0l-3.75-3.75M12 12l3.75-3.75M12 12l-3.75 3.75m0 0l3.75 3.75M12 12l3.75 3.75m-7.5-3.75h7.5" />
  </svg>
);

export default CogIcon;