
import React from 'react';

interface IconProps {
  className?: string;
}

const UsersIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.066M12 6c0-1.657-1.343-3-3-3S6 4.343 6 6s1.343 3 3 3 3-1.343 3-3m0 0c0 1.657 1.343 3 3 3s3-1.343 3-3S17.657 3 15 3m-9 9a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.066m-3.741 5.545A3 3 0 012.25 13.5a8.956 8.956 0 011.086-4.332m15.346 0a8.956 8.956 0 011.086 4.332 3 3 0 01-5.364 2.887M12 18a9.03 9.03 0 01-4.473-1.225" />
  </svg>
);

export default UsersIcon;
