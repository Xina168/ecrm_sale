
export interface ExcelRow {
  [key: string]: string | number;
}

export interface ChartDataItem {
  name: string;
  value: number;
  grade?: string; // Added for customer grading
}

export enum ChartType {
  BAR = 'Bar',
  DOUGHNUT = 'Doughnut',
}

export const SHOW_ITEMS_OPTIONS = {
  TOP_10: "Top 10",
  TOP_20: "Top 20",
  TOP_30: "Top 30",
  ALL: "All",
  COUNT_ALL_LABELS: "Count All Labels",
  // COLUMN_COVERAGE: "Column Coverage", // Removed
  // CUSTOMERS_PER_SALE: "Customers per Sale", // Removed
} as const;

export type ShowItemsType = typeof SHOW_ITEMS_OPTIONS[keyof typeof SHOW_ITEMS_OPTIONS];


export interface SummaryMetrics {
  totalPaymentVoucher: number;
  totalSuppliers: number;
  grandTotalAmount: number;    // Sum of selectedDataColumn for all items
  totalAmountPaid: number;     // Sum of selectedDataColumn where status is "Paid"
  totalAmountUnpaid: number;   // Sum of selectedDataColumn where status is NOT "Paid"
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}