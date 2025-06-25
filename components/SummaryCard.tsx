
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string; // e.g., 'border-blue-500'
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-dark-gray uppercase font-semibold">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-2 rounded-full bg-opacity-20 ${colorClass.replace('border-', 'bg-')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
