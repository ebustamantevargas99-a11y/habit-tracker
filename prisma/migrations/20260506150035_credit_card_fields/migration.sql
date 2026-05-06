-- Add credit-card / loan specific fields to FinancialAccount.
-- Statement / due / bureau days are 1-31 ints; minPaymentLast is float.
-- All nullable since they only apply to credit & loan account types.

ALTER TABLE "FinancialAccount"
  ADD COLUMN "statementDay"    INTEGER,
  ADD COLUMN "dueDay"          INTEGER,
  ADD COLUMN "bureauReportDay" INTEGER,
  ADD COLUMN "minPaymentLast"  DOUBLE PRECISION;
