import jsPDF, { type TextOptionsLight } from "jspdf";
import dayjs from "dayjs";
import type { Transaction } from "@/types";

export interface ReportQuickStats {
  avgDailySpending: number;
  largestExpenseAmount: number;
  largestExpenseTitle: string;
  topCategoryName: string;
  topCategoryPercent: number;
  savingsRatePercent: number;
  totalExpense: number;
  totalIncome: number;
}

export interface ExpenseCategoryStat {
  name: string;
  spent: number;
  percent: number;
}

interface GenerateReportsPdfOptions {
  periodLabel: string;
  selectedMonth: string;
  currencySymbol: string;
  quickStats: ReportQuickStats;
  insight: string;
  transactions: Transaction[];
  expenseCategoryStats: ExpenseCategoryStat[];
}

const formatCurrency = (
  currencySymbol: string,
  amount: number,
  fractionDigits = 2
) =>
  `${currencySymbol}${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;

export const generateReportsPdf = ({
  periodLabel,
  selectedMonth,
  currencySymbol,
  quickStats,
  insight,
  transactions,
  expenseCategoryStats,
}: GenerateReportsPdfOptions) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let cursorY = margin;

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - margin) {
      pdf.addPage();
      cursorY = margin;
    }
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(10);
    pdf.setFontSize(13);
    pdf.setTextColor(40);
    pdf.text(title, margin, cursorY);
    cursorY += 6;
    pdf.setDrawColor(230);
    pdf.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 4;
  };

  const addBodyText = (text: string) => {
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
    lines.forEach((line) => {
      ensureSpace(6);
      pdf.setFontSize(10);
      pdf.setTextColor(60);
      pdf.text(line, margin, cursorY);
      cursorY += 5;
    });
    cursorY += 2;
  };

  const addStatGrid = (
    stats: Array<{ label: string; value: string }>,
    columns = 2
  ) => {
    const columnWidth = (pageWidth - margin * 2) / columns;
    stats.forEach((stat, index) => {
      const column = index % columns;
      if (column === 0) {
        ensureSpace(14);
      }
      const x = margin + column * columnWidth;
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(stat.label, x, cursorY);
      pdf.setFontSize(12);
      pdf.setTextColor(20);
      pdf.text(stat.value, x, cursorY + 5);
      if (column === columns - 1 || index === stats.length - 1) {
        cursorY += 12;
      }
    });
    cursorY += 2;
  };

  const transactionsForReport = [...transactions].sort(
    (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
  );

  const addTransactionsTable = () => {
    if (transactionsForReport.length === 0) {
      addBodyText("No transactions recorded for this period.");
      return;
    }

    const headers = ["Date", "Title", "Category", "Type", "Amount"];
    const columnWidths = [25, 60, 35, 20, 30];

    const drawHeader = () => {
      ensureSpace(10);
      pdf.setFontSize(9);
      pdf.setTextColor(255);
      pdf.setFillColor(20, 92, 174);
      const headerHeight = 7;
      pdf.rect(
        margin,
        cursorY - headerHeight + 2,
        pageWidth - margin * 2,
        headerHeight,
        "F"
      );
      let currentX = margin;
      headers.forEach((header, index) => {
        pdf.text(header, currentX + 2, cursorY + 1);
        currentX += columnWidths[index];
      });
      cursorY += 6;
    };

    drawHeader();
    pdf.setFontSize(9);
    pdf.setTextColor(30);

    const rowHeight = 6;
    transactionsForReport.forEach((transaction) => {
      ensureSpace(rowHeight + 2);
      let currentX = margin;
      const values = [
        dayjs(transaction.date).format("MMM D"),
        transaction.title,
        transaction.category?.name || "Other",
        transaction.type,
        `${transaction.amount >= 0 ? "+" : "-"}${formatCurrency(
          currencySymbol,
          transaction.amount
        )}`,
      ];

      values.forEach((value, index) => {
        const text = pdf.splitTextToSize(value, columnWidths[index] - 4);
        pdf.text(text as string[], currentX + 2, cursorY);
        currentX += columnWidths[index];
      });
      cursorY += rowHeight;
    });
  };

  // Title Section
  pdf.setFontSize(18);
  pdf.setTextColor(20);
  pdf.text("Cashly Monthly Report", pageWidth / 2, cursorY, {
    align: "center",
  } as TextOptionsLight);
  cursorY += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(80);
  pdf.text(`Period: ${periodLabel}`, pageWidth / 2, cursorY, {
    align: "center",
  } as TextOptionsLight);
  cursorY += 10;

  // Summary Section
  addSectionTitle("Summary");
  const summaryItems = [
    `Total income of ${formatCurrency(
      currencySymbol,
      quickStats.totalIncome
    )} and total expenses of ${formatCurrency(
      currencySymbol,
      quickStats.totalExpense
    )}.`,
    `Average daily spending was ${formatCurrency(
      currencySymbol,
      quickStats.avgDailySpending
    )} with a savings rate of ${quickStats.savingsRatePercent.toFixed(1)}%.`,
    quickStats.largestExpenseAmount > 0
      ? `Largest expense: ${quickStats.largestExpenseTitle} (${formatCurrency(
          currencySymbol,
          quickStats.largestExpenseAmount,
          0
        )}).`
      : "No expense data available for this period.",
  ];
  summaryItems.forEach(addBodyText);
  addBodyText(`Insight: ${insight}`);

  // Quick Stats Grid
  addSectionTitle("Key Metrics");
  addStatGrid([
    {
      label: "Total Income",
      value: formatCurrency(currencySymbol, quickStats.totalIncome),
    },
    {
      label: "Total Expense",
      value: formatCurrency(currencySymbol, quickStats.totalExpense),
    },
    {
      label: "Savings",
      value: formatCurrency(
        currencySymbol,
        Math.max(quickStats.totalIncome - quickStats.totalExpense, 0)
      ),
    },
    {
      label: "Savings Rate",
      value: `${quickStats.savingsRatePercent.toFixed(1)}%`,
    },
    {
      label: "Avg. Daily Spending",
      value: formatCurrency(currencySymbol, quickStats.avgDailySpending),
    },
    {
      label: "Top Category",
      value: `${
        quickStats.topCategoryName
      } (${quickStats.topCategoryPercent.toFixed(1)}%)`,
    },
  ]);

  // Category Breakdown
  addSectionTitle("Top Categories");
  if (expenseCategoryStats.length === 0) {
    addBodyText("No categorized expenses for this period.");
  } else {
    expenseCategoryStats.slice(0, 5).forEach((categoryStat) => {
      addBodyText(
        `${categoryStat.name}: ${formatCurrency(
          currencySymbol,
          categoryStat.spent,
          0
        )} (${categoryStat.percent.toFixed(1)}% of expenses)`
      );
    });
  }

  // Transactions
  addSectionTitle("Transactions");
  addTransactionsTable();

  pdf.save(`Cashly_Report_${selectedMonth}.pdf`);
};
