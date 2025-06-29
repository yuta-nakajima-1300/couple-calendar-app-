import { holidaySet, getHolidayName } from '../constants/japaneseHolidays';

// 日付の種類を定義
export type DateType = 'weekday' | 'saturday' | 'sunday' | 'holiday';

// 色の定数
export const DATE_COLORS = {
  weekday: '#333333',     // 平日：黒
  saturday: '#0066cc',    // 土曜日：青
  sunday: '#dc143c',      // 日曜日：赤
  holiday: '#dc143c',     // 祝日：赤
} as const;

/**
 * 日付文字列（YYYY-MM-DD）から日付の種類を判定する
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns DateType
 */
export const getDateType = (dateString: string): DateType => {
  // 祝日チェック（優先度最高）
  if (holidaySet.has(dateString)) {
    return 'holiday';
  }

  // 曜日チェック
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日

  if (dayOfWeek === 0) {
    return 'sunday';
  } else if (dayOfWeek === 6) {
    return 'saturday';
  } else {
    return 'weekday';
  }
};

/**
 * 日付の種類に応じた色を取得する
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns 色コード
 */
export const getDateColor = (dateString: string): string => {
  const dateType = getDateType(dateString);
  return DATE_COLORS[dateType];
};

/**
 * 日付が土曜日かどうかを判定
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns boolean
 */
export const isSaturday = (dateString: string): boolean => {
  return getDateType(dateString) === 'saturday';
};

/**
 * 日付が日曜日かどうかを判定
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns boolean
 */
export const isSunday = (dateString: string): boolean => {
  return getDateType(dateString) === 'sunday';
};

/**
 * 日付が祝日かどうかを判定
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns boolean
 */
export const isHoliday = (dateString: string): boolean => {
  return getDateType(dateString) === 'holiday';
};

/**
 * 日付が休日（土日祝）かどうかを判定
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns boolean
 */
export const isWeekend = (dateString: string): boolean => {
  const dateType = getDateType(dateString);
  return dateType === 'saturday' || dateType === 'sunday' || dateType === 'holiday';
};

/**
 * 日付の詳細情報を取得（祝日名含む）
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns 日付情報オブジェクト
 */
export const getDateInfo = (dateString: string) => {
  const dateType = getDateType(dateString);
  const color = DATE_COLORS[dateType];
  const holidayName = getHolidayName(dateString);

  return {
    dateString,
    dateType,
    color,
    holidayName,
    isWeekend: isWeekend(dateString),
  };
};