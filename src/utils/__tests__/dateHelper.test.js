/**
 * Tests para DateHelper - Validar uso correcto
 * Archivo: src/utils/__tests__/dateHelper.test.js
 */

/* global describe test expect */

import {
  getNowLocal,
  safeConvertToTimezone,
  formatForDisplay,
  formatForInput,
} from "../dateHelper.js";

describe("DateHelper - Uso Correcto", () => {
  test('getNowLocal nunca retorna "Invalid Date"', () => {
    const result = getNowLocal();
    expect(result).not.toBe("Invalid Date");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("safeConvertToTimezone maneja inputs inválidos", () => {
    expect(safeConvertToTimezone("Invalid Date")).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    expect(safeConvertToTimezone(null)).toBeNull();
    expect(safeConvertToTimezone(undefined)).toBeNull();
    expect(safeConvertToTimezone("")).toBeNull();
  });

  test("safeConvertToTimezone maneja datetime-local", () => {
    const result = safeConvertToTimezone("2026-03-08T14:30");
    expect(result).toBe("2026-03-08 14:30:00");
    expect(result).not.toBe("Invalid Date");
  });

  test("formatForDisplay siempre retorna formato legible", () => {
    const result = formatForDisplay("2026-03-08 14:30:00");
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} [ap]\. m\./);
  });

  test("formatForInput retorna formato correcto", () => {
    const result = formatForInput("2026-03-08 14:30:00");
    expect(result).toBe("2026-03-08T14:30");
  });
});

describe("DateHelper - Anti-Patterns", () => {
  test('NUNCA debe retornar "Invalid Date"', () => {
    // Estos son los casos que causaron el error 500
    expect(safeConvertToTimezone("Invalid Date")).not.toBe("Invalid Date");
    expect(safeConvertToTimezone("mal-formato")).not.toBe("Invalid Date");
    expect(safeConvertToTimezone("2026-13-45T99:99")).not.toBe("Invalid Date");
  });
});
