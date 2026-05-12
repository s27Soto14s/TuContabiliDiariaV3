/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Transaction, FinancialSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFinancialAdvice(
  summary: FinancialSummary,
  transactions: Transaction[]
): Promise<string> {
  try {
    const prompt = `
      Actúa como un experto asesor financiero para pequeños negocios. 
      Analiza el siguiente resumen financiero y los movimientos recientes para dar consejos breves, prácticos y alentadores.
      
      RESUMEN ACTUAL:
      - Ingresos Totales: $${summary.totalIncomes}
      - Gastos Totales: $${summary.totalExpenses}
      - Balance Neto: $${summary.balance}
      - Estado: ${summary.status === 'profit' ? 'Rentable' : summary.status === 'loss' ? 'En pérdida' : 'Equilibrado'}
      
      DESGLOSE DE GASTOS POR CATEGORÍA:
      ${Object.entries(summary.categoryBreakdown)
        .map(([cat, amount]) => `- ${cat}: $${amount}`)
        .join('\n')}
      
      MOVIMIENTOS RECIENTES:
      ${transactions.slice(-5).map(t => `- ${t.type === 'income' ? 'Ingreso' : 'Gasto'}: $${t.amount} (${t.description})`).join('\n')}
      
      INSTRUCCIONES:
      1. Si hay pérdida, sugiere formas específicas de reducir los gastos más altos.
      2. Si hay poca ganancia, sugiere cómo aumentar el flujo de caja o revisar precios.
      3. Si es rentable, felicita y sugiere cómo reinvertir o escalar.
      4. Mantén un tono profesional pero cercano, optimista y en español.
      5. La respuesta debe tener un máximo de 3 párrafos cortos.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "No pude generar consejos en este momento. ¡Sigue adelante con tu negocio!";
  } catch (error) {
    console.error("Error fetching AI advice:", error);
    return "Lo siento, hubo un problema al conectar con el asistente de IA. Revisa tu conexión.";
  }
}
