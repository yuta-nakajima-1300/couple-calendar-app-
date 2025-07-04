/**
 * レート制限ユーティリティ
 * API呼び出しやセキュリティ関連の操作に対する制限を実装
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * レート制限のチェック
   * @param key 制限対象のキー（例: 'login_user123', 'invite_check_ip'）
   * @param maxAttempts 最大試行回数
   * @param windowMs 時間窓（ミリ秒）
   * @returns 制限内の場合true、制限超過の場合false
   */
  checkLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      // 新規エントリまたは期限切れ
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (entry.count >= maxAttempts) {
      // 制限超過
      return false;
    }
    
    // カウントを増やす
    entry.count++;
    return true;
  }
  
  /**
   * 残り試行回数を取得
   */
  getRemainingAttempts(key: string, maxAttempts: number): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - entry.count);
  }
  
  /**
   * リセット時間を取得（ミリ秒）
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime;
  }
  
  /**
   * 特定のキーをリセット
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
  
  /**
   * 全てのレート制限をクリア
   */
  clearAll(): void {
    this.limits.clear();
  }
  
  /**
   * 期限切れのエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.limits.delete(key));
  }
}

// シングルトンインスタンス
export const rateLimiter = new RateLimiter();

// レート制限の設定
export const RateLimitConfig = {
  // ログイン試行
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15分
    getMessage: (remaining: number) => 
      remaining === 0 
        ? 'ログイン試行回数が上限に達しました。15分後に再度お試しください。' 
        : `ログインに失敗しました。残り${remaining}回試行できます。`
  },
  
  // 招待コード検証
  INVITE_CODE: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1時間
    getMessage: (remaining: number) => 
      remaining === 0
        ? '招待コードの検証回数が上限に達しました。1時間後に再度お試しください。'
        : `無効な招待コードです。残り${remaining}回試行できます。`
  },
  
  // イベント作成
  EVENT_CREATE: {
    maxAttempts: 50,
    windowMs: 60 * 60 * 1000, // 1時間
    getMessage: (remaining: number) => 
      remaining === 0
        ? 'イベント作成の上限に達しました。1時間後に再度お試しください。'
        : null
  },
  
  // API呼び出し全般
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1分
    getMessage: (remaining: number) => 
      remaining === 0
        ? 'リクエストが多すぎます。しばらく待ってから再度お試しください。'
        : null
  }
} as const;

/**
 * レート制限付き関数実行
 */
export async function withRateLimit<T>(
  key: string,
  config: typeof RateLimitConfig[keyof typeof RateLimitConfig],
  fn: () => Promise<T>
): Promise<T> {
  if (!rateLimiter.checkLimit(key, config.maxAttempts, config.windowMs)) {
    const message = config.getMessage(0);
    throw new Error(message || 'Rate limit exceeded');
  }
  
  try {
    return await fn();
  } catch (error) {
    // エラー時も試行回数にカウント
    const remaining = rateLimiter.getRemainingAttempts(key, config.maxAttempts);
    const message = config.getMessage(remaining);
    
    if (message && remaining < config.maxAttempts) {
      throw new Error(message);
    }
    
    throw error;
  }
}

// 定期的なクリーンアップ（メモリリーク防止）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000); // 5分ごと
}