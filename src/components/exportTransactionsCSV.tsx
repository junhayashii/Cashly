import Papa from "papaparse";
import { saveAs } from "file-saver";

export const exportTransactionsCSV = (
  transactions: any[],
  fileName = "transactions.csv"
) => {
  if (!transactions || transactions.length === 0) return;

  // CSV用のデータ整形
  const csvData = transactions.map((t) => ({
    Date: t.date,
    Type: t.type,
    Category: t.category_name,
    Amount: t.amount,
    Description: t.title || "",
  }));

  const csv = Papa.unparse(csvData);

  // ブラウザにダウンロード
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, fileName);
};
