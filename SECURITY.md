# セキュリティガイド

## 概要

このドキュメントでは、カップルカレンダーアプリのセキュリティ対策について説明します。

## 実装済みのセキュリティ対策

### 1. 環境変数によるシークレット管理

**以前の問題:**
- Firebase APIキーがソースコードに直接記述されていた
- 機密情報がリポジトリに露出していた

**解決策:**
- `.env` ファイルを使用した環境変数管理
- `EXPO_PUBLIC_` プレフィックスによる適切なスコープ設定
- `.env.example` ファイルによるテンプレート提供

**使用方法:**
```bash
# .env ファイルを作成
cp .env.example .env
# 実際のAPIキーを設定
vim .env
```

### 2. Firestore セキュリティルール

**実装内容:**
- ユーザーは自分のデータのみアクセス可能
- カップル連携されたユーザー間でのみデータ共有
- 入力値の形式検証をルールレベルで実装
- 危険なデータの保存を防止

**主要ルール:**
```javascript
// ユーザーは自分のドキュメントのみアクセス可能
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// イベントはカップル間で共有
match /events/{eventId} {
  allow read, write: if request.auth != null && 
                      (resource.data.createdBy == request.auth.uid ||
                       isPartOfCouple(request.auth.uid, resource.data.coupleId));
}
```

### 3. 強化された認証システム

**改善点:**
- デモアカウントは開発環境でのみ利用可能
- 強力なパスワード設定（Dev2024!SecurePass）
- メールアドレス形式の検証
- レート制限の実装

**実装例:**
```typescript
// 開発環境でのみデモアカウントを提供
const isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
const sampleAccounts = isDevelopment ? [...] : [];
```

### 4. セキュアな招待コード生成

**改善点:**
- `crypto.getRandomValues()` を使用したセキュアな乱数生成
- 紛らわしい文字（0, O, I, L）の除外
- 8文字の固定長による推測困難性の向上

**実装:**
```typescript
generateInviteCode(): string {
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  // ...
}
```

### 5. 包括的な入力値検証

**新機能:**
- HTMLエスケープ機能
- XSS攻撃対策
- SQLインジェクション対策
- CSP（Content Security Policy）違反の検出
- レート制限機能

**使用例:**
```typescript
// イベントタイトルの検証
const titleValidation = validateEventTitle(title);
if (!titleValidation.isValid) {
  Alert.alert('エラー', titleValidation.error);
  return;
}

// 入力値のサニタイゼーション
const sanitizedTitle = sanitizeInput(title, { 
  maxLength: 100, 
  removeHtml: true 
});
```

## セキュリティベストプラクティス

### 開発者向け

1. **環境変数の管理**
   - `.env` ファイルをバージョン管理に含めない
   - 本番環境では新しいAPIキーを生成する
   - 定期的にシークレットをローテーションする

2. **入力値の処理**
   - 全ての入力値に対してバリデーションを実施
   - サニタイゼーション後のデータを使用
   - 信頼できないデータを直接レンダリングしない

3. **エラーハンドリング**
   - 機密情報をエラーメッセージに含めない
   - ログに個人情報を記録しない
   - 適切なエラーレベルで記録する

### 運用者向け

1. **Firebase設定**
   - Firestoreセキュリティルールを本番環境にデプロイ
   - Firebase Authenticationの設定を確認
   - 不正アクセスの監視を設定

2. **監視とロギング**
   - 異常なアクセスパターンの監視
   - セキュリティイベントのアラート設定
   - 定期的なセキュリティ監査の実施

## セキュリティテスト

### テスト方法

```typescript
// セキュリティユーティリティのテスト実行
import { testSecurityUtils } from './src/utils/securityUtils';
testSecurityUtils();
```

### 手動テスト項目

1. **XSS攻撃のテスト**
   ```javascript
   // 危険な入力例
   "<script>alert('XSS')</script>"
   "javascript:alert('XSS')"
   "<img src=x onerror=alert('XSS')>"
   ```

2. **SQLインジェクションのテスト**
   ```sql
   -- 危険な入力例
   "'; DROP TABLE users; --"
   "1' OR '1'='1"
   ```

3. **認証バイパスのテスト**
   - 無効なトークンでのアクセス試行
   - 他ユーザーのデータへの不正アクセス試行

## 今後の改善予定

### 短期的な改善

1. **証明書ピンニング**
   - SSL証明書ピンニングの実装
   - 中間者攻撃の防止

2. **暗号化の強化**
   - ローカルストレージデータの暗号化
   - Expo SecureStoreの活用

3. **監査ログ**
   - 全てのデータアクセスのログ記録
   - セキュリティイベントの追跡

### 長期的な改善

1. **多要素認証（MFA）**
   - SMS認証の実装
   - TOTP認証の対応

2. **脆弱性スキャン**
   - 依存関係の脆弱性チェック
   - 定期的なセキュリティスキャン

3. **ペネトレーションテスト**
   - 外部セキュリティ監査の実施
   - 脆弱性の継続的な改善

## 緊急時の対応

### セキュリティインシデント発生時

1. **即座に実行すべき対応**
   - 影響範囲の特定
   - アクセスの遮断
   - ユーザーへの通知

2. **調査と復旧**
   - ログの分析
   - 脆弱性の修正
   - セキュリティパッチの適用

3. **事後対応**
   - インシデントの文書化
   - 再発防止策の実装
   - セキュリティプロセスの見直し

## 問い合わせ

セキュリティに関する問題や質問は、以下の方法でご連絡ください：

- **緊急時:** security@example.com
- **一般的な質問:** dev-team@example.com
- **脆弱性報告:** security-bugs@example.com

---

**最終更新:** 2024年12月
**担当者:** 開発チーム
**次回レビュー:** 2025年3月