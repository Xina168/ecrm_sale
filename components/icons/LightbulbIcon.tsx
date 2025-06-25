import React from 'react';

interface IconProps {
  className?: string;
}

const LightbulbIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a12.053 12.053 0 01-4.5 0M12 3a9 9 0 100 18 9 9 0 000-18zm-3.75 9.75h7.5c.069 0 .123.017.168.052l.006.004c.04.028.068.073.068.125a2.251 2.251 0 010 4.318 2.25 2.25 0 01-4.318 0 2.25 2.25 0 01-2.09-3.468c-.01-.02-.016-.04-.02-.061a.48.48 0 01.05-.443.478.478 0 01.442-.257z" />
  </svg>
);

export default LightbulbIcon;