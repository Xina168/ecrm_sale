
import React from 'react';

interface IconProps {
  className?: string;
}
const TableIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5V7.5M10.125 5.25h3.75m-3.75 0V3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.875m-7.5 0h11.25m-11.25 0V3.375c0-.621-.504-1.125-1.125-1.125h-1.5A1.125 1.125 0 002.25 3.375v1.875m18.375 0h-1.125m1.125 0V3.375c0-.621-.504-1.125-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v1.875M4.5 7.5v10.125c0 .621.504 1.125 1.125 1.125H18.375c.621 0 1.125-.504 1.125-1.125V7.5M4.5 7.5h15M4.5 11.25h15M4.5 15h15" />
  </svg>
);
export default TableIcon;
