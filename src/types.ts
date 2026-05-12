/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 'materiales' | 'transporte' | 'otros' | 'ventas' | 'servicios';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: ExpenseCategory | 'ingreso_general';
  date: number;
}

export interface FinancialSummary {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
  status: 'profit' | 'loss' | 'neutral';
  recommendation: string;
}
