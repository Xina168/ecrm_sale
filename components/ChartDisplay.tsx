
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ChartDataItem, ChartType } from '../types';

type EffectiveChartMode = 'sum' | 'count_data_column' | 'count_label_column';

interface ChartDisplayProps {
  data: ChartDataItem[];
  chartType: ChartType;
  labelColumn: string;
  // dataColumn: string; // Removed as it's not passed and valueUnitName provides the necessary info
  paidFilterActive: boolean;
  effectiveChartMode: EffectiveChartMode; // Still kept for potential structural context, though App.tsx fixes it to 'count_label_column'
  valueUnitName: string; // Added to receive dynamic y-axis/value description
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D', '#A4DE6C', '#D0ED57', '#FFC658'];
const RADIAN = Math.PI / 180;

interface CustomizedLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomizedLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent * 100 < 3) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const ChartDisplay: React.FC<ChartDisplayProps> = ({
    data,
    chartType,
    labelColumn,
    // dataColumn, // Removed
    paidFilterActive,
    effectiveChartMode,
    valueUnitName, // Added
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>No data to display. Check selections or upload file.</p>
      </div>
    );
  }

  const xAxisLabelText = labelColumn || "Label";
  // yAxisLabelText and chartTitle are now directly derived from valueUnitName for simplicity and to match App.tsx's intent
  const yAxisLabelText = valueUnitName;
  const chartTitle = valueUnitName; // Used for Pie chart tooltip title and Bar chart legend name


  // The complex logic for chartTitle and yAxisLabelText based on effectiveChartMode, 
  // displayLabelName, displayDataColName, and paidFilterActive has been simplified
  // as App.tsx now controls these aspects and passes a definitive 'valueUnitName'.
  // 'effectiveChartMode' is kept in props in case it's used for other structural logic,
  // but for title/label generation, 'valueUnitName' is primary.

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === ChartType.BAR ? (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={80} tick={{fontSize: 10}} label={{ value: xAxisLabelText, position: 'insideBottom', offset: -65, dy: 10, style:{fontSize:12, fill: '#666'}}} />
            <YAxis tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} label={{ value: yAxisLabelText, angle: -90, position: 'insideLeft', style:{fontSize:12, fill: '#666'} }}/>
            <Tooltip formatter={(value: number) => [`${value.toLocaleString()}`, yAxisLabelText]} />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="value" name={yAxisLabelText} fill="#3B82F6" />
          </BarChart>
        ) : (
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="80%"
              innerRadius="40%"
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${name}: ${value.toLocaleString()}`, chartTitle]} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartDisplay;
