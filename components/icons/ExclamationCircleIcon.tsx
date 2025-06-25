
import React from 'react';

interface IconProps {
  className?: string;
}

const ExclamationCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.956 11.956 0 0112 2.25c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12A11.956 11.956 0 0112 2.25zM12 15h.008v.008H12V15z" />
  </svg>
);

export default ExclamationCircleIcon;