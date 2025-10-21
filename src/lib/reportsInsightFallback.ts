export type ReportsInsightInput = {
  periodLabel?: string;
  currencySymbol?: string;
  avgDailySpending?: number;
  largestExpenseTitle?: string;
  largestExpenseAmount?: number;
  topCategoryName?: string;
  topCategoryPercent?: number;
  savingsRatePercent?: number;
  totalIncome?: number;
  totalExpense?: number;
};

const normalizeCategoryName = (value?: string) => {
  if (!value || value.trim() === "-" || value.trim().length === 0) return null;
  return value.trim();
};

const round = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.round(value);
};

export const buildReportsInsightFallback = (
  input: ReportsInsightInput
): string => {
  const periodLabel = input.periodLabel || "今月";
  const currencySymbol = input.currencySymbol || "$";
  const totalExpense = Math.max(input.totalExpense ?? 0, 0);
  const totalIncome = Math.max(input.totalIncome ?? 0, 0);
  const savingsRatePercent = input.savingsRatePercent ?? 0;
  const topCategoryPercent = input.topCategoryPercent ?? 0;
  const topCategoryName = normalizeCategoryName(input.topCategoryName);
  const largestExpenseTitle = normalizeCategoryName(
    input.largestExpenseTitle
  );
  const largestExpenseAmount = input.largestExpenseAmount ?? 0;
  const avgDailySpending = input.avgDailySpending ?? 0;

  const numberFormatter = new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 0,
  });
  const formatCurrency = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
      return null;
    }
    return `${currencySymbol}${numberFormatter.format(Math.round(value))}`;
  };
  const formatPercent = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
      return null;
    }
    return `${round(value)}%`;
  };

  if (totalExpense <= 0 && totalIncome <= 0) {
    return `${periodLabel}はまだ大きな動きがありません。焦らず、これからの記録を一緒に見守っていきましょう。`;
  }

  const segments: string[] = [];

  const incomeText = formatCurrency(totalIncome);
  const expenseText = formatCurrency(totalExpense);
  const net = totalIncome - totalExpense;
  const netText = formatCurrency(Math.abs(net));

  if (incomeText && expenseText) {
    if (net < 0 && netText) {
      segments.push(
        `${periodLabel}は収入${incomeText}に対して支出${expenseText}で${netText}の赤字になりました`
      );
    } else if (net > 0 && netText) {
      segments.push(
        `${periodLabel}は収入${incomeText}、支出${expenseText}で${netText}を確保できました`
      );
    } else {
      segments.push(
        `${periodLabel}は収入${incomeText}、支出${expenseText}で大きな差は出ませんでした`
      );
    }
  } else if (expenseText) {
    segments.push(`${periodLabel}は支出${expenseText}でした`);
  } else if (incomeText) {
    segments.push(`${periodLabel}は収入${incomeText}を記録できました`);
  } else {
    segments.push(`${periodLabel}の家計は落ち着いています`);
  }

  let insightSegment: string | null = null;

  if (topCategoryName) {
    const topPercentText = formatPercent(topCategoryPercent);
    const qualifier = topPercentText
      ? `が支出の約${topPercentText}を占めていたので`
      : "に気持ちが向いていたみたいで";
    insightSegment = `特に「${topCategoryName}」${qualifier}、その時間を大切にした証ですね`;
  } else if (largestExpenseTitle) {
    const largestExpenseText = formatCurrency(largestExpenseAmount);
    insightSegment = `大きな支出は「${largestExpenseTitle}」${
      largestExpenseText ? `(${largestExpenseText})` : ""
    }で、必要な投資だった気持ちも伝わってきます`;
  }

  const savingsText = formatPercent(savingsRatePercent);
  if (!insightSegment && incomeText && expenseText && savingsText) {
    insightSegment = `結果として貯蓄率は約${savingsText}で、整えたいポイントが見えてきました`;
  }

  const dailyText = formatCurrency(avgDailySpending);
  if (!insightSegment && dailyText) {
    insightSegment = `1日あたりの平均支出はおよそ${dailyText}で、日々の感覚とも一致していそうです`;
  }

  if (insightSegment) {
    segments.push(insightSegment);
  }

  let actionSegment: string;
  if (net < 0 && topCategoryName) {
    actionSegment = `次は「${topCategoryName}」の使い方を少しだけ意識して、心地よいペースを一緒に探していきましょうね`;
  } else if (net < 0 && largestExpenseTitle) {
    actionSegment = `次は「${largestExpenseTitle}」が本当に必要だった理由を振り返って、負担が軽くなる工夫を考えてみましょうね`;
  } else if (net > 0 && netText) {
    actionSegment = `次は残せた${netText}の活かし方を決めて、嬉しい使い道に繋げていきましょうね`;
  } else if (incomeText && expenseText) {
    actionSegment = "次は同じバランスを保ちながら、無理のない余裕づくりを考えていきましょうね";
  } else if (expenseText && dailyText) {
    actionSegment = `次は日々の支出を${dailyText}前後に整えるイメージで、安心できる範囲を一緒に描いていきましょうね`;
  } else {
    actionSegment = "次は気になる支出を一つだけ選んで、どう向き合うと心が軽くなるか考えてみましょうね";
  }

  segments.push(actionSegment);

  return `${segments.join("、")}。`;
};
