
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ExcelRow, ChartDataItem, ChartType, SummaryMetrics, SHOW_ITEMS_OPTIONS, ShowItemsType } from './types';
import Sidebar from './components/Sidebar';
import SummaryCard from './components/SummaryCard';
import ChartDisplay from './components/ChartDisplay';
import MenuIcon from './components/icons/MenuIcon';
import DocumentIcon from './components/icons/DocumentIcon';
import UsersIcon from './components/icons/UsersIcon';
import MoneyBagIcon from './components/icons/MoneyBagIcon';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import ExclamationCircleIcon from './components/icons/ExclamationCircleIcon';
import LightbulbIcon from './components/icons/LightbulbIcon';

type EffectiveChartMode = 'sum' | 'count_data_column' | 'count_label_column';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  const [selectedLabelColumn, setSelectedLabelColumn] = useState<string>('');
  const [selectedDataColumn, setSelectedDataColumn] = useState<string>(''); // Still used for summary cards
  const [selectedStatusColumn, setSelectedStatusColumn] = useState<string>('');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(ChartType.BAR);
  const [selectedCountDisplayLimit, setSelectedCountDisplayLimit] = useState<ShowItemsType>(SHOW_ITEMS_OPTIONS.TOP_10);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalPaymentVoucher: 0,
    totalSuppliers: 0,
    grandTotalAmount: 0,
    totalAmountPaid: 0,
    totalAmountUnpaid: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // AI States
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
      console.warn("API_KEY environment variable not set. AI features will be disabled.");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);


  const normalizeKey = (name: string): string => {
    if (typeof name !== 'string' || !name) return '';
    let key = name.toLowerCase();
    key = key.replace(/^(mr|ms|mrs|dr)\.?\s*/, '');
    key = key.replace(/[.,]+$/, '');
    key = key.replace(/\s+/g, ' ').trim();
    return key;
  };

  const handleFileChange = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setSelectedLabelColumn('');
    setSelectedDataColumn('');
    setSelectedStatusColumn('');
    setSearchTerm('');
    setSelectedCountDisplayLimit(SHOW_ITEMS_OPTIONS.TOP_10); // Default for the only mode
    setAiPrompt('');
    setAiResponse('');
    setAiError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Failed to read file.");
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        if (jsonData.length === 0) {
          setError("The Excel file is empty or has no data in the first sheet.");
          setExcelData([]);
          setHeaders([]);
          return;
        }

        const firstRow = jsonData[0];
        const extractedHeaders = Object.keys(firstRow);
        setExcelData(jsonData);
        setHeaders(extractedHeaders);

        const allowedLabelNamesForAutoSelect = ["Sale", "Customer"]; // Prioritized order for auto-selection
        let autoSelectedLabel = '';
        for (const name of allowedLabelNamesForAutoSelect) {
            const foundHeader = extractedHeaders.find(h => h.toLowerCase() === name.toLowerCase());
            if (foundHeader) { 
                autoSelectedLabel = foundHeader; 
                break; 
            }
        }
        
        // If the auto-selected label (after checking "Sale", then "Customer") is not actually one of them,
        // it means neither was found. In this case, selectedLabelColumn should be empty.
        if (autoSelectedLabel && !allowedLabelNamesForAutoSelect.map(n => n.toLowerCase()).includes(autoSelectedLabel.toLowerCase())) {
            autoSelectedLabel = '';
        }
        setSelectedLabelColumn(autoSelectedLabel);


        // selectedDataColumn is still needed for summary cards
        const preferredDataColumnNames = ["Total Payment", "Total Amount"];
        let autoSelectedData = '';
        for (const preferredName of preferredDataColumnNames) {
            const foundHeader = extractedHeaders.find(h => h.toLowerCase() === preferredName.toLowerCase());
            if (foundHeader) {
                autoSelectedData = foundHeader;
                break;
            }
        }
        
        if (!autoSelectedData) {
            const commonNumericHeaders = ["amount", "value", "total", "qty", "quantity", "paid", "price"];
            autoSelectedData = 
                extractedHeaders.find(h => 
                    commonNumericHeaders.some(nh => h.toLowerCase().includes(nh)) && 
                    jsonData.some(row => !isNaN(parseFloat(String(row[h]))))
                ) ||
                extractedHeaders.find(h => 
                    jsonData.some(row => !isNaN(parseFloat(String(row[h])))) && h.toLowerCase() !== autoSelectedLabel.toLowerCase()
                ) || '';
        }
        setSelectedDataColumn(autoSelectedData);

        const paymentHeader = extractedHeaders.find(h => h.toLowerCase() === "payment");
        if (paymentHeader) {
            setSelectedStatusColumn(paymentHeader);
        } else {
            const commonStatusHeaders = ["status", "payment status", "condition"];
            setSelectedStatusColumn(extractedHeaders.find(h => commonStatusHeaders.some(sh => h.toLowerCase().includes(sh))) || '');
        }
      } catch (err) {
        console.error("Error processing Excel file:", err);
        setError(`Error processing Excel file: ${err instanceof Error ? err.message : String(err)}`);
        setExcelData([]);
        setHeaders([]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => { setError("Failed to read file."); setIsLoading(false); }
    reader.readAsBinaryString(file);
  }, []);

  // const isSumModeActive = false; // Always false now
  const isCountModeActive = true; // Always true now

  const paidFilterActive = useMemo(() => !!selectedStatusColumn, [selectedStatusColumn]);

  // effectiveChartMode will always be 'count_label_column'
  const effectiveChartMode: EffectiveChartMode = 'count_label_column';

  const shouldApplyGrading = useMemo(() => {
    return selectedLabelColumn.toLowerCase() === 'customer' &&
           paidFilterActive;
  }, [selectedLabelColumn, paidFilterActive]);


  useEffect(() => {
    if (excelData.length === 0 ) {
      setChartData([]);
      setSummaryMetrics({ totalPaymentVoucher: 0, totalSuppliers: 0, grandTotalAmount: 0, totalAmountPaid: 0, totalAmountUnpaid: 0 });
      return;
    }

    let dataForProcessing = excelData;
    if (paidFilterActive) { 
         dataForProcessing = excelData.filter(row => {
            const statusValue = row[selectedStatusColumn];
            return statusValue !== undefined && String(statusValue).toLowerCase() === 'paid';
        });
    }

    let finalGroupedData: { [key: string]: { value: number; originalNames: { [name: string]: number } } } = {};

    const canProcessChart = selectedLabelColumn; 

    if (canProcessChart) {
        const counts: { [key: string]: { countValue: number; originalNames: { [name: string]: number } } } = {};
        const totalPaymentHeader = headers.find(h => h.toLowerCase() === 'total payment');
        const saleHeader = headers.find(h => h.toLowerCase() === 'sale');

        dataForProcessing.forEach(row => {
            const originalLabel = String(row[selectedLabelColumn]);
            if (!originalLabel && originalLabel !== "0") return;
            const normalizedLabelKey = normalizeKey(originalLabel);

            let shouldIncrement = false;
            if (selectedLabelColumn.toLowerCase() === 'customer' && paidFilterActive && totalPaymentHeader && saleHeader) {
                shouldIncrement = row[totalPaymentHeader] !== undefined && !isNaN(parseFloat(String(row[totalPaymentHeader]))) &&
                                  row[saleHeader] !== undefined && String(row[saleHeader]).trim() !== '';
            } 
            else if (selectedLabelColumn.toLowerCase() === 'customer' && paidFilterActive && totalPaymentHeader && !saleHeader) { 
                shouldIncrement = row[totalPaymentHeader] !== undefined && !isNaN(parseFloat(String(row[totalPaymentHeader])));
            }
            else {
                shouldIncrement = true; 
            }


            if (shouldIncrement) {
                if (!counts[normalizedLabelKey]) {
                    counts[normalizedLabelKey] = { countValue: 0, originalNames: {} };
                }
                counts[normalizedLabelKey].countValue++;
                counts[normalizedLabelKey].originalNames[originalLabel] = (counts[normalizedLabelKey].originalNames[originalLabel] || 0) + 1;
            }
        });
        Object.entries(counts).forEach(([key, data]) => {
            finalGroupedData[key] = { value: data.countValue, originalNames: data.originalNames };
        });
    }

    let baseProcessedChartDataItems = Object.entries(finalGroupedData)
        .map(([_, data]) => {
          let displayName = '';
          if (data.originalNames && Object.keys(data.originalNames).length > 0) {
              displayName = Object.keys(data.originalNames).reduce((a, b) => data.originalNames[a] > data.originalNames[b] ? a : b);
          }
          return { name: displayName, value: data.value };
        })
        .filter(item => item.name || item.name === "0")
        .sort((a, b) => b.value - a.value);

    let itemsWithGradesOrPlaceholder: ChartDataItem[] = baseProcessedChartDataItems;

    if (shouldApplyGrading) {
        itemsWithGradesOrPlaceholder = baseProcessedChartDataItems.map((item, index) => {
            const rank = index + 1; 
            let grade = 'Grad D'; 
            if (rank <= 10) grade = 'Grad A';
            else if (rank <= 20) grade = 'Grad B';
            else if (rank <= 30) grade = 'Grad C';
            return { ...item, grade };
        });
    } else {
         itemsWithGradesOrPlaceholder = baseProcessedChartDataItems.map(item => ({ ...item, grade: '-' }));
    }
    
    let displaySlicedData = itemsWithGradesOrPlaceholder;

    if (selectedCountDisplayLimit !== SHOW_ITEMS_OPTIONS.ALL) {
        let limit = 0;
        if (selectedCountDisplayLimit === SHOW_ITEMS_OPTIONS.TOP_10) limit = 10;
        else if (selectedCountDisplayLimit === SHOW_ITEMS_OPTIONS.TOP_20) limit = 20;
        else if (selectedCountDisplayLimit === SHOW_ITEMS_OPTIONS.TOP_30) limit = 30;
        displaySlicedData = displaySlicedData.slice(0, limit);
    }
    
    setChartData(canProcessChart ? displaySlicedData : []);

    let countOfPaidVouchers = 0;
    if (selectedStatusColumn) {
        countOfPaidVouchers = excelData.filter(row => {
            const statusValue = row[selectedStatusColumn];
            return statusValue !== undefined && String(statusValue).toLowerCase() === 'paid';
        }).length;
    }
    
    let totalUniqueCustomers = 0;
    const customerHeader = headers.find(h => h.toLowerCase() === 'customer');
    if (customerHeader && excelData.length > 0) {
        const uniqueCustomerValues = new Set<string>();
        excelData.forEach(row => {
            const customerValue = row[customerHeader];
            if (customerValue !== undefined && customerValue !== null) {
                uniqueCustomerValues.add(normalizeKey(String(customerValue)));
            }
        });
        totalUniqueCustomers = uniqueCustomerValues.size;
    }

    let newGrandTotalAmount = 0;
    let newTotalAmountPaidValue = 0;
    if (selectedDataColumn) { 
        excelData.forEach(row => {
          const amountValue = parseFloat(String(row[selectedDataColumn]));
          if (!isNaN(amountValue)) {
            newGrandTotalAmount += amountValue;
            if (selectedStatusColumn && String(row[selectedStatusColumn]).toLowerCase() === 'paid') {
              newTotalAmountPaidValue += amountValue;
            }
          }
        });
    }
    const newTotalAmountUnpaidValue = selectedStatusColumn ? newGrandTotalAmount - newTotalAmountPaidValue : newGrandTotalAmount;
    
    setSummaryMetrics({
      totalPaymentVoucher: countOfPaidVouchers,
      totalSuppliers: totalUniqueCustomers,
      grandTotalAmount: newGrandTotalAmount,
      totalAmountPaid: selectedStatusColumn ? newTotalAmountPaidValue : 0,
      totalAmountUnpaid: newTotalAmountUnpaidValue,
    });

  }, [excelData, headers, selectedLabelColumn, selectedDataColumn, selectedStatusColumn, selectedCountDisplayLimit, paidFilterActive, shouldApplyGrading]); 


  const handleExportChart = useCallback(async () => {
    if (!chartContainerRef.current || chartData.length === 0) {
      alert("No chart to export or chart data is empty."); return;
    }
    try {
      const canvas = await html2canvas(chartContainerRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`chart-export-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) { console.error("Error exporting chart:", e); alert("Failed to export chart."); }
  }, [chartData]);

  const filteredTableData = useMemo(() => {
    if (!searchTerm) return chartData;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return chartData.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(lowerSearchTerm);
      if (nameMatch) return true;
      if (shouldApplyGrading && item.grade) {
        const gradeMatch = item.grade.toLowerCase().includes(lowerSearchTerm);
        if (gradeMatch) return true;
      }
      return false;
    });
  }, [chartData, searchTerm, shouldApplyGrading]);

  const tableValueHeaderDisplay = useMemo(() => {
    const labelColName = selectedLabelColumn || 'Items';
    const currentLabelColNameLower = labelColName.toLowerCase();
    
    if (currentLabelColNameLower === 'customer') {
        return 'Total Customer Cooperated';
    } else if (paidFilterActive) {
        if (currentLabelColNameLower === 'sale') return 'Customer Cooperated';
        return `Count of Paid ${labelColName}`;
    } else { 
        return `Count of ${labelColName}`;
    }
  }, [selectedLabelColumn, paidFilterActive]);


  const handleExportTopData = useCallback(() => {
    if (filteredTableData.length === 0) { alert("No data to export."); return; }
    const labelHeader = selectedLabelColumn || 'Label';
    const valueHeader = tableValueHeaderDisplay;
    
    try {
      const dataToExport = filteredTableData.map(item => {
        const exportItem: any = {
          [labelHeader]: item.name,
          [valueHeader]: item.value
        };
        if (shouldApplyGrading) {
          exportItem['Grading'] = item.grade;
        }
        return exportItem;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ExportedData");
      XLSX.writeFile(workbook, `data-export-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) { console.error("Error exporting data:", e); alert("Failed to export data."); }
  }, [filteredTableData, selectedLabelColumn, tableValueHeaderDisplay, shouldApplyGrading]);

  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const tableTitle = useMemo(() => {
    const labelNameToUse = selectedLabelColumn || 'Items';
    let prefix = selectedCountDisplayLimit === SHOW_ITEMS_OPTIONS.ALL ? "All " : `${selectedCountDisplayLimit} `;
    
    let baseTitle = "";
    const currentLabelNameLower = labelNameToUse.toLowerCase();

    if (currentLabelNameLower === 'customer') {
        baseTitle = `Total Customer Cooperated`;
    } else if (paidFilterActive) {
        if (currentLabelNameLower === 'sale') baseTitle = `Customer Cooperated`;
        else baseTitle = `Count of Paid ${labelNameToUse}`;
    } else { 
        baseTitle = `Count of ${labelNameToUse}`;
    }
    
    return `${prefix}${baseTitle}${shouldApplyGrading ? " with Grading" : ""}`;
  }, [selectedLabelColumn, paidFilterActive, selectedCountDisplayLimit, shouldApplyGrading]);

  const canDisplayChartAndTable = excelData.length > 0 && selectedLabelColumn;

  const getMissingSelectionMessage = () => {
    if (excelData.length === 0) return "Please upload an Excel file to get started.";
    if (!selectedLabelColumn) return "Please select a Label Column for Total Count analysis.";
    return "Ensure appropriate selections are made to visualize data.";
  };

  const handleGetAiInsights = useCallback(async () => {
    if (!ai) { setAiError("AI service is not initialized. Check API_KEY."); return; }
    if (!canDisplayChartAndTable || chartData.length === 0) { setAiError("No data available for AI analysis."); return; }

    setIsAiLoading(true); setAiResponse(''); setAiError(null);

    const aiValueHeader = tableValueHeaderDisplay; 
    const dataForPrompt = chartData.slice(0, 50).map(item => {
        const entry: any = { [selectedLabelColumn || 'Label']: item.name, [aiValueHeader]: item.value };
        if (shouldApplyGrading && item.grade && item.grade !== '-') {
            entry['Grading'] = item.grade;
        }
        return entry;
    });
    const currentTableTitle = tableTitle;
    const systemInstruction = `You are an expert data analyst. Your task is to analyze the provided dataset and offer insights. The data is about: "${currentTableTitle}".`;
    const userQuery = aiPrompt.trim() || `Provide a concise summary of key insights, trends, or anomalies in this data. Focus on the most significant findings.`;
    const fullPrompt = `Context:\nData Title: "${currentTableTitle}"\nData Sample (up to 50 items):\n${JSON.stringify(dataForPrompt, null, 2)}\n\nUser's Request: ${userQuery}\n\nPlease provide the response in clear, easy-to-understand language. If you identify specific data points, refer to them by their label and value. Keep your analysis concise and focused on actionable insights or significant observations based *only* on the provided data sample and context. Do not make up external information.`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: fullPrompt });
      setAiResponse(response.text);
    } catch (e) {
      console.error("Error calling Gemini API:", e);
      setAiError(`Failed to get AI insights: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAiLoading(false);
    }
  }, [ai, chartData, selectedLabelColumn, aiPrompt, canDisplayChartAndTable, tableTitle, tableValueHeaderDisplay, shouldApplyGrading]);

  const searchPlaceholderText = useMemo(() => {
    const labelName = selectedLabelColumn || 'Label';
    return shouldApplyGrading ? `Search ${labelName} or Grade...` : `Search ${labelName}...`;
  }, [selectedLabelColumn, shouldApplyGrading]);

  const searchAriaLabelText = useMemo(() => {
    const labelName = selectedLabelColumn || 'Label';
    return shouldApplyGrading ? `Search by ${labelName} or Grade` : `Search by ${labelName}`;
  }, [selectedLabelColumn, shouldApplyGrading]);


  return (
    <div className="flex h-screen bg-light-gray font-sans">
      {sidebarOpen && (
        <Sidebar
          onFileChange={handleFileChange}
          fileName={fileName}
          headers={headers}
          selectedLabelColumn={selectedLabelColumn}
          onLabelColumnChange={setSelectedLabelColumn}
          selectedChartType={selectedChartType}
          onChartTypeChange={setSelectedChartType}
          onExportChart={handleExportChart}
          onExportTopData={handleExportTopData}
          isDataLoaded={excelData.length > 0}
          isChartDataAvailable={chartData.length > 0}
          selectedCountDisplayLimit={selectedCountDisplayLimit}
          onCountDisplayLimitChange={setSelectedCountDisplayLimit}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600 hover:text-primary mr-4" aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-primary">E-CRM K.S.P.M Analysis</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {isLoading && <div className="flex justify-center items-center h-32" role="status" aria-live="polite"><p className="text-primary">Loading data...</p></div>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <SummaryCard title="Total Payment Voucher" value={summaryMetrics.totalPaymentVoucher.toLocaleString()} icon={<DocumentIcon className="w-6 h-6 text-blue-500" />} colorClass="border-blue-500" />
            <SummaryCard title="Total Customer" value={summaryMetrics.totalSuppliers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-500" />} colorClass="border-orange-500" />
            <SummaryCard title="GRAND TOTAL AMOUNT" value={formatCurrency(summaryMetrics.grandTotalAmount)} icon={<MoneyBagIcon className="w-6 h-6 text-red-500" />} colorClass="border-red-500" />
            <SummaryCard title="TOTAL PAID" value={formatCurrency(summaryMetrics.totalAmountPaid)} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} colorClass="border-green-500" />
            <SummaryCard title="TOTAL UNPAID" value={formatCurrency(summaryMetrics.totalAmountUnpaid)} icon={<ExclamationCircleIcon className="w-6 h-6 text-yellow-500" />} colorClass="border-yellow-500" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md h-[calc(100vh-400px)] min-h-[350px]" ref={chartContainerRef} aria-label="Chart display area">
            {canDisplayChartAndTable && chartData.length > 0 ? (
              <ChartDisplay
                data={chartData}
                chartType={selectedChartType}
                labelColumn={selectedLabelColumn}
                paidFilterActive={paidFilterActive}
                effectiveChartMode={effectiveChartMode} 
                valueUnitName={tableValueHeaderDisplay} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500"><p>{getMissingSelectionMessage()}</p></div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h2 className="text-lg font-semibold text-primary mb-2 sm:mb-0" id="table-title">{tableTitle}</h2>
              {canDisplayChartAndTable && chartData.length > 0 && (
                 <div className="w-full sm:w-auto sm:max-w-xs">
                    <label htmlFor="tableSearch" className="sr-only">{searchAriaLabelText}</label>
                    <input type="search" id="tableSearch" placeholder={searchPlaceholderText} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"/>
                 </div>
              )}
            </div>
            {!canDisplayChartAndTable ? (<div className="flex items-center justify-center h-20 text-slate-500"><p>{getMissingSelectionMessage()}</p></div>)
            : chartData.length === 0 ? (<div className="flex items-center justify-center h-20 text-slate-500"><p>{paidFilterActive ? "No 'Paid' items found for the current selections." : "No data to display based on current selections or filters."}</p></div>)
            : filteredTableData.length === 0 ? (<div className="flex items-center justify-center h-20 text-slate-500"><p>No results found for "{searchTerm}".</p></div>)
            : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200" aria-labelledby="table-title">
                  <thead className="bg-gray-50"><tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{selectedLabelColumn || 'Label'}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tableValueHeaderDisplay}</th>
                    {shouldApplyGrading && (
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grading</th>
                    )}
                  </tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTableData.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.value)}</td>
                        {shouldApplyGrading && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.grade || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center"><LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />AI Powered Insights</h2>
            {!ai && (<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert"><p className="font-bold">AI Service Not Available</p><p>The API_KEY is not configured.</p></div>)}
            {ai && !canDisplayChartAndTable && excelData.length > 0 && (<div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert"><p>Select a Label Column to enable AI insights.</p></div>)}
            {ai && excelData.length === 0 && (<div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert"><p>Upload an Excel file to enable AI insights.</p></div>)}
            {ai && (canDisplayChartAndTable || chartData.length > 0 || aiResponse || isAiLoading || aiError) && (
              <>
                <div>
                  <label htmlFor="aiPrompt" className="block text-sm font-medium text-slate-600 mb-1">Ask about current data or leave blank for summary:</label>
                  <textarea id="aiPrompt" rows={3} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Top 3 items? Outliers?" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" disabled={!canDisplayChartAndTable || chartData.length === 0 || isAiLoading}/>
                </div>
                <button onClick={handleGetAiInsights} disabled={!canDisplayChartAndTable || chartData.length === 0 || isAiLoading || !ai} className="mt-3 w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAiLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</>) : "Ask AI"}
                </button>
                {aiError && (<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">AI Error: </strong><span className="block sm:inline">{aiError}</span></div>)}
                {aiResponse && !aiError && (<div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 min-h-[100px]" aria-live="polite"><h3 className="text-sm font-semibold text-slate-700 mb-2">AI Analysis:</h3><pre className="whitespace-pre-wrap text-sm text-slate-600">{aiResponse}</pre></div>)}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
