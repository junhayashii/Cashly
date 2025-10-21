type FallbackInput = {
  categoryName?: string;
  spent?: number;
  monthlyBudget?: number;
};

const fallbackTemplates: Array<(input: FallbackInput) => string> = [
  ({ categoryName }) =>
    `「${categoryName ?? "このカテゴリ"}」、ちょっと使いすぎちゃったかな？次は無理せず整えていきましょう。`,
  ({ categoryName }) =>
    `今月は「${categoryName ?? "このカテゴリ"}」で楽しみが多かったみたい。来月は気持ちゆるめに調整していきましょう。`,
  ({ categoryName }) =>
    `「${categoryName ?? "このカテゴリ"}」はつい手が伸びちゃいますよね。大丈夫、次でバランスを取れば十分ですよ。`,
];

export const buildEmpatheticFallbackLine = (
  input: FallbackInput
): string => {
  const template =
    fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
  return template(input).trim();
};
