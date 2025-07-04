# Firebase セキュリティ設定ガイド

## 🔐 必須のセキュリティ設定

### 1. Firestore セキュリティルールのデプロイ

```bash
# Firebase CLIでログイン
firebase login

# セキュリティルールをデプロイ
firebase deploy --only firestore:rules
```

### 2. Firebase Console でのAPIキー制限設定

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. プロジェクト「couple-calendar-app-ac225」を選択
3. **プロジェクト設定** → **全般** タブ
4. 「ウェブ API キー」の横の「編集」をクリック
5. **アプリケーションの制限** で以下を設定：
   - **HTTP リファラー（ウェブサイト）** を選択
   - 許可するドメイン：
     ```
     https://couple-calendar-app-.netlify.app/*
     http://localhost:3000/*
     http://localhost:8081/*
     ```
6. **API の制限** で以下を設定：
   - **キーを制限** を選択
   - 必要なAPIのみ選択：
     - Identity Toolkit API
     - Cloud Firestore API
     - Firebase Installations API

### 3. Netlify での環境変数設定

1. [Netlify Dashboard](https://app.netlify.com) にアクセス
2. サイトを選択
3. **Site configuration** → **Environment variables**
4. 以下の環境変数を追加：

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA6rjou9WjkG-Ivqfpqcis5jZXbGLfyXDY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=couple-calendar-app-ac225.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=couple-calendar-app-ac225
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=couple-calendar-app-ac225.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1093220447522
EXPO_PUBLIC_FIREBASE_APP_ID=1:1093220447522:web:9d96a3e6087f9ad4f6217b
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-00RBKPTXQ7
EXPO_PUBLIC_ENVIRONMENT=production
```

### 4. Firebase Authentication 設定

1. Firebase Console → **Authentication** → **Sign-in method**
2. **Google** を有効化
3. **承認済みドメイン** で以下を追加：
   - `couple-calendar-app-.netlify.app`
   - `localhost` (開発用)

### 5. Firestore インデックスの作成

```bash
# インデックスをデプロイ
firebase deploy --only firestore:indexes
```

## 🛡️ 実装済みのセキュリティ機能

### ✅ 環境変数による設定管理
- APIキーなどの機密情報を環境変数で管理
- ハードコードされた値の除去

### ✅ CSPヘッダー
- Content Security Policy による XSS 対策
- 各種セキュリティヘッダーの設定

### ✅ レート制限
- ログイン試行: 15分で5回まで
- 招待コード検証: 1時間で10回まで
- イベント作成: 1時間で50回まで

### ✅ データ暗号化
- Expo SecureStore による機密データの暗号化
- Web環境でのフォールバック実装

### ✅ 入力値検証
- XSS対策のサニタイゼーション
- 各種バリデーション機能

## 📋 デプロイ前チェックリスト

- [ ] Firestore セキュリティルールをデプロイ
- [ ] APIキーのドメイン制限を設定
- [ ] Netlify環境変数を設定
- [ ] CSPヘッダーが正しく設定されている
- [ ] レート制限が機能している
- [ ] 暗号化が正常に動作している

## 🚨 緊急時の対応

### APIキーが漏洩した場合
1. Firebase Console で該当のAPIキーを無効化
2. 新しいAPIキーを生成
3. Netlify環境変数を更新
4. 再デプロイ

### 不正アクセスが検知された場合
1. Firestore セキュリティルールで一時的にアクセスを制限
2. ログを確認して攻撃パターンを特定
3. 必要に応じてIPブロックやレート制限を強化

## 📞 連絡先

セキュリティインシデント発生時:
- Firebase Support: https://firebase.google.com/support
- Netlify Support: https://www.netlify.com/support/

---
最終更新: 2024年12月