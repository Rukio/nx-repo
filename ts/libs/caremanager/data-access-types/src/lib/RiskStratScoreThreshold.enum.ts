export enum RiskStratScoreThreshold {
  Low = 0,
  Medium = 5.5,
  High = 10,
}

export const getScoreThreshold = (score: number) => {
  if (score >= RiskStratScoreThreshold.High) {
    return RiskStratScoreThreshold.High;
  }
  if (score >= RiskStratScoreThreshold.Medium) {
    return RiskStratScoreThreshold.Medium;
  }

  return RiskStratScoreThreshold.Low;
};
