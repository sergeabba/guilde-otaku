import { countdownTo, daysUntil, isLeapYear, nextOccurrence, occurrenceIn } from "../app/utils/birthdays";
import { parseBirthday, getDaysUntil } from "../app/types";

describe("birthdays", () => {
  test("isLeapYear", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  test("a 29 February birthday is observed on the 28th in a common year", () => {
    expect(occurrenceIn(2026, 29, 2).getDate()).toBe(28);
    expect(occurrenceIn(2026, 29, 2).getMonth()).toBe(1);
    expect(occurrenceIn(2028, 29, 2).getDate()).toBe(29);
  });

  test("today counts as zero days", () => {
    const now = new Date(2026, 10, 13, 15, 30);
    expect(daysUntil(13, 11, now)).toBe(0);
  });

  test("tomorrow is one day away even late at night", () => {
    const now = new Date(2026, 10, 13, 23, 59);
    expect(daysUntil(14, 11, now)).toBe(1);
  });

  test("a date already passed rolls over to next year", () => {
    const now = new Date(2026, 10, 13);
    const next = nextOccurrence(10, 11, now);
    expect(next.getFullYear()).toBe(2027);
    expect(daysUntil(10, 11, now)).toBe(362);
  });

  test("year boundary", () => {
    expect(daysUntil(1, 1, new Date(2026, 11, 31, 12))).toBe(1);
  });

  test("countdown breaks the remaining time down", () => {
    const now = new Date(2026, 10, 13, 22, 0, 0);
    const target = new Date(2026, 10, 15);
    expect(countdownTo(target, now)).toEqual({ days: 1, hours: 2, minutes: 0, seconds: 0, done: false });
    expect(countdownTo(now, target).done).toBe(true);
  });

  test("parseBirthday reads French month names, with or without accents", () => {
    expect(parseBirthday("01 Août")).toEqual({ day: 1, month: 8 });
    expect(parseBirthday("18 février")).toEqual({ day: 18, month: 2 });
    expect(parseBirthday("n'importe quoi")).toBeNull();
    expect(getDaysUntil("")).toBe(Infinity);
  });
});
