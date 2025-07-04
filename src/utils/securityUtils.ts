/**
 * セキュリティ関連のユーティリティ関数
 */

// HTML エスケープ関数
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

// 入力値のサニタイゼーション
export const sanitizeInput = (input: string, options: {
  maxLength?: number;
  allowedChars?: RegExp;
  removeHtml?: boolean;
} = {}): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // HTMLタグを除去
  if (options.removeHtml !== false) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // 最大文字数制限
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // 許可された文字のみ保持
  if (options.allowedChars) {
    sanitized = sanitized.replace(options.allowedChars, '');
  }
  
  return sanitized;
};

// イベントタイトルの検証
export const validateEventTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'タイトルは必須です' };
  }
  
  const sanitizedTitle = sanitizeInput(title, { maxLength: 100 });
  
  if (sanitizedTitle.length === 0) {
    return { isValid: false, error: 'タイトルは必須です' };
  }
  
  if (sanitizedTitle.length > 100) {
    return { isValid: false, error: 'タイトルは100文字以内で入力してください' };
  }
  
  // 危険なパターンをチェック
  const dangerousPatterns = [
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitizedTitle)) {
      return { isValid: false, error: '不正な文字が含まれています' };
    }
  }
  
  return { isValid: true };
};

// イベント説明の検証
export const validateEventDescription = (description: string): { isValid: boolean; error?: string } => {
  if (!description) {
    return { isValid: true }; // 説明は任意
  }
  
  if (typeof description !== 'string') {
    return { isValid: false, error: '説明の形式が正しくありません' };
  }
  
  const sanitizedDescription = sanitizeInput(description, { maxLength: 500 });
  
  if (sanitizedDescription.length > 500) {
    return { isValid: false, error: '説明は500文字以内で入力してください' };
  }
  
  return { isValid: true };
};

// 時刻の検証
export const validateTime = (time: string): { isValid: boolean; error?: string } => {
  if (!time || typeof time !== 'string') {
    return { isValid: false, error: '時刻は必須です' };
  }
  
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timePattern.test(time)) {
    return { isValid: false, error: '時刻の形式が正しくありません (HH:MM)' };
  }
  
  return { isValid: true };
};

// 日付の検証
export const validateDate = (date: string): { isValid: boolean; error?: string } => {
  if (!date || typeof date !== 'string') {
    return { isValid: false, error: '日付は必須です' };
  }
  
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!datePattern.test(date)) {
    return { isValid: false, error: '日付の形式が正しくありません (YYYY-MM-DD)' };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: '無効な日付です' };
  }
  
  // 過去の日付チェック（必要に応じて）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) {
    // 過去の日付も許可する場合はこの行をコメントアウト
    // return { isValid: false, error: '過去の日付は設定できません' };
  }
  
  return { isValid: true };
};

// メールアドレスの検証
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'メールアドレスは必須です' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'メールアドレスの形式が正しくありません' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }
  
  return { isValid: true };
};

// パスワードの検証
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'パスワードは必須です' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'パスワードは8文字以上で入力してください' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'パスワードは128文字以内で入力してください' };
  }
  
  // 強度チェック
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strengthCount < 3) {
    return { 
      isValid: false, 
      error: 'パスワードには大文字、小文字、数字、特殊文字のうち3種類以上を含めてください' 
    };
  }
  
  return { isValid: true };
};

// 一般的な入力値検証
export const validateInput = (
  input: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => boolean;
  }
): { isValid: boolean; error?: string } => {
  if (rules.required && (!input || typeof input !== 'string' || input.trim().length === 0)) {
    return { isValid: false, error: 'この項目は必須です' };
  }
  
  if (!input) {
    return { isValid: true }; // 任意項目で空の場合
  }
  
  if (typeof input !== 'string') {
    return { isValid: false, error: '入力値の形式が正しくありません' };
  }
  
  const trimmedInput = input.trim();
  
  if (rules.minLength && trimmedInput.length < rules.minLength) {
    return { isValid: false, error: `${rules.minLength}文字以上で入力してください` };
  }
  
  if (rules.maxLength && trimmedInput.length > rules.maxLength) {
    return { isValid: false, error: `${rules.maxLength}文字以内で入力してください` };
  }
  
  if (rules.pattern && !rules.pattern.test(trimmedInput)) {
    return { isValid: false, error: '入力形式が正しくありません' };
  }
  
  if (rules.customValidator && !rules.customValidator(trimmedInput)) {
    return { isValid: false, error: '入力値が無効です' };
  }
  
  return { isValid: true };
};

// CSP (Content Security Policy) 違反の検出
export const detectCSPViolation = (content: string): boolean => {
  const dangerousPatterns = [
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i,
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<style/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(content));
};

// レート制限チェック用のシンプルなメモリベースの実装
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  checkLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 古いリクエストを削除
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= limit) {
      return false; // 制限に達している
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true; // 制限内
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new SimpleRateLimiter();

// 使用例とテスト関数
export const testSecurityUtils = () => {
  console.log('=== セキュリティユーティリティのテスト ===');
  
  // HTMLエスケープのテスト
  console.log('HTMLエスケープ:', escapeHtml('<script>alert("XSS")</script>'));
  
  // 入力値サニタイゼーションのテスト
  console.log('サニタイゼーション:', sanitizeInput('<p>Hello World</p>', { maxLength: 50 }));
  
  // バリデーションのテスト
  console.log('イベントタイトル検証:', validateEventTitle('テストイベント'));
  console.log('無効なタイトル検証:', validateEventTitle('<script>alert("XSS")</script>'));
  
  // 時刻検証のテスト
  console.log('時刻検証:', validateTime('14:30'));
  console.log('無効な時刻検証:', validateTime('25:30'));
  
  // 日付検証のテスト
  console.log('日付検証:', validateDate('2024-12-25'));
  console.log('無効な日付検証:', validateDate('2024-13-45'));
  
  // メール検証のテスト
  console.log('メール検証:', validateEmail('user@example.com'));
  console.log('無効なメール検証:', validateEmail('invalid-email'));
  
  // パスワード検証のテスト
  console.log('パスワード検証:', validatePassword('SecurePass123!'));
  console.log('弱いパスワード検証:', validatePassword('weak'));
  
  // CSP違反検出のテスト
  console.log('CSP違反検出:', detectCSPViolation('<script>alert("XSS")</script>'));
  console.log('安全なコンテンツ:', detectCSPViolation('Hello World'));
  
  // レート制限のテスト
  console.log('レート制限 (1回目):', rateLimiter.checkLimit('test', 3, 60000));
  console.log('レート制限 (2回目):', rateLimiter.checkLimit('test', 3, 60000));
  console.log('レート制限 (3回目):', rateLimiter.checkLimit('test', 3, 60000));
  console.log('レート制限 (4回目):', rateLimiter.checkLimit('test', 3, 60000));
  
  console.log('=== テスト完了 ===');
};