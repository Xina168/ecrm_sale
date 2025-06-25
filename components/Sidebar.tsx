
import React, { useState, useEffect } from 'react';
import { ExcelRow, ChartType, SHOW_ITEMS_OPTIONS, ShowItemsType } from '../types';
import UploadIcon from './icons/UploadIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import TableIcon from './icons/TableIcon';
import CogIcon from './icons/CogIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface SidebarProps {
  onFileChange: (file: File) => void;
  fileName: string | null;
  headers: string[];
  selectedLabelColumn: string; 
  onLabelColumnChange: (value: string) => void;
  selectedChartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  onExportChart: () => void;
  onExportTopData: () => void;
  isDataLoaded: boolean;
  isChartDataAvailable: boolean;
  selectedCountDisplayLimit: ShowItemsType; 
  onCountDisplayLimitChange: (value: ShowItemsType) => void; 
}

const Sidebar: React.FC<SidebarProps> = ({
  onFileChange,
  fileName,
  headers,
  selectedLabelColumn,
  onLabelColumnChange,
  selectedChartType,
  onChartTypeChange,
  onExportChart,
  onExportTopData,
  isDataLoaded,
  isChartDataAvailable,
  selectedCountDisplayLimit,
  onCountDisplayLimitChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDataConfigOpen, setIsDataConfigOpen] = useState(true);

  const countLimitOptions: ShowItemsType[] = [
    SHOW_ITEMS_OPTIONS.TOP_10,
    SHOW_ITEMS_OPTIONS.TOP_20,
    SHOW_ITEMS_OPTIONS.TOP_30,
    SHOW_ITEMS_OPTIONS.ALL,
  ];

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };
  
  const preferredLabelOrder = ["Sale", "Customer"]; 
  const actualHeadersMap = new Map<string, string>(); // lowercase -> original case
  headers.forEach(h => actualHeadersMap.set(h.toLowerCase(), h));

  const orderedFilteredLabelHeaders: string[] = [];
  for (const preferredName of preferredLabelOrder) {
    const lowerPreferredName = preferredName.toLowerCase();
    if (actualHeadersMap.has(lowerPreferredName)) {
      orderedFilteredLabelHeaders.push(actualHeadersMap.get(lowerPreferredName)!);
    }
  }
  
  return (
    <div className="w-80 bg-white p-6 space-y-6 shadow-lg h-full overflow-y-auto">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <UploadIcon className="w-5 h-5 mr-2 text-primary" />
          Upload Excel File
        </h3>
        <button
          onClick={handleFileButtonClick}
          className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150 flex items-center justify-center text-sm"
          aria-label="Choose Excel file to upload"
        >
          Choose File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept=".xlsx, .xls"
          className="hidden"
          aria-hidden="true"
        />
        {fileName && <p className="text-xs text-slate-500 mt-2 truncate" aria-label={`Selected file: ${fileName}`}>Selected: {fileName}</p>}
        <p className="text-xs text-slate-500 mt-1">Accepted: .xlsx, .xls. Ensure column headers.</p>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsDataConfigOpen(!isDataConfigOpen)}
          className="w-full flex items-center justify-between text-lg font-semibold text-slate-700 focus:outline-none"
          aria-expanded={isDataConfigOpen}
          aria-controls="data-config-section"
        >
          <span className="flex items-center">
            <CogIcon className="w-5 h-5 mr-2 text-primary" />
            Data Configuration
          </span>
          {isDataConfigOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-600" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600" />}
        </button>
        
        {isDataConfigOpen && (
          <div id="data-config-section" className="space-y-4 mt-4">
            <div>
              <label htmlFor="countDisplayLimit" className="block text-sm font-medium text-slate-600 mb-1">Show Items:</label>
              <select
                id="countDisplayLimit"
                value={selectedCountDisplayLimit}
                onChange={(e) => onCountDisplayLimitChange(e.target.value as ShowItemsType)}
                disabled={!isDataLoaded}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
              >
                {countLimitOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="labelColumn" className="block text-sm font-medium text-slate-600 mb-1">
                Select Label Column:
              </label>
              <select
                id="labelColumn"
                value={selectedLabelColumn}
                onChange={(e) => onLabelColumnChange(e.target.value)}
                disabled={!isDataLoaded || orderedFilteredLabelHeaders.length === 0}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
              >
                {/* No default "-- Select Column --" option, first available allowed header will be selected by App.tsx logic */}
                {orderedFilteredLabelHeaders.map(header => <option key={header} value={header}>{header}</option>)}
              </select>
               {isDataLoaded && orderedFilteredLabelHeaders.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    None of the allowed label columns ({preferredLabelOrder.join(', ')}) were found in the uploaded file.
                  </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Select Chart Type:</h3>
        <div className="flex space-x-2">
          {(Object.values(ChartType) as ChartType[]).map(type => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              disabled={!isDataLoaded}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
                ${selectedChartType === type ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700 hover:bg-gray-300'}
                ${!isDataLoaded ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-pressed={selectedChartType === type}
              aria-disabled={!isDataLoaded}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Export Data</h3>
        <div className="space-y-2">
          <button
            onClick={onExportChart}
            disabled={!isDataLoaded || !isChartDataAvailable} 
            className="w-full bg-sky-100 text-sky-700 px-4 py-2 rounded-md hover:bg-sky-200 transition duration-150 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!isDataLoaded || !isChartDataAvailable}
          >
            <ChartBarIcon className="w-4 h-4 mr-2" /> Export Chart (PDF)
          </button>
          <button
            onClick={onExportTopData}
            disabled={!isDataLoaded || !isChartDataAvailable} 
            className="w-full bg-emerald-100 text-emerald-700 px-4 py-2 rounded-md hover:bg-emerald-200 transition duration-150 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!isDataLoaded || !isChartDataAvailable}
          >
            <TableIcon className="w-4 h-4 mr-2" /> Export Data (XLSX)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
