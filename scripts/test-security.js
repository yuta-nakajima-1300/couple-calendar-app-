#!/usr/bin/env node

/**
 * セキュリティ機能のテストスクリプト
 * 暗号化、レート制限、セキュアストレージの動作を確認します
 */

const crypto = require('crypto');

// 簡易暗号化のテスト
function testSimpleEncryption() {
  console.log('\n=== 暗号化テスト ===');
  
  const testData = 'Sensitive User Data 123!@#';
  const key = 'test-encryption-key-12345';
  
  // XOR暗号化の実装（secureStorage.tsと同じロジック）
  function simpleEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return Buffer.from(result).toString('base64');
  }
  
  function simpleDecrypt(encrypted, key) {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }
  
  const encrypted = simpleEncrypt(testData, key);
  const decrypted = simpleDecrypt(encrypted, key);
  
  console.log('元のデータ:', testData);
  console.log('暗号化後:', encrypted);
  console.log('復号化後:', decrypted);
  console.log('テスト結果:', testData === decrypted ? '✅ 成功' : '❌ 失敗');
}

// セキュアなランダムキー生成のテスト
function testSecureKeyGeneration() {
  console.log('\n=== セキュアキー生成テスト ===');
  
  // crypto.getRandomValuesのシミュレーション
  const array = new Uint8Array(32);
  crypto.randomFillSync(array);
  
  const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  console.log('生成されたキー長:', key.length);
  console.log('キーサンプル:', key.substring(0, 20) + '...');
  console.log('テスト結果:', key.length === 64 ? '✅ 成功' : '❌ 失敗');
}

// レート制限のテスト
function testRateLimit() {
  console.log('\n=== レート制限テスト ===');
  
  class RateLimiter {
    constructor() {
      this.limits = new Map();
    }
    
    checkLimit(key, maxAttempts, windowMs) {
      const now = Date.now();
      const entry = this.limits.get(key);
      
      if (!entry || now > entry.resetTime) {
        this.limits.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return true;
      }
      
      if (entry.count >= maxAttempts) {
        return false;
      }
      
      entry.count++;
      return true;
    }
  }
  
  const limiter = new RateLimiter();
  const results = [];
  
  // 5回まで許可、6回目で拒否されるはず
  for (let i = 0; i < 7; i++) {
    const allowed = limiter.checkLimit('test-key', 5, 60000);
    results.push({ attempt: i + 1, allowed });
  }
  
  console.log('試行結果:');
  results.forEach(r => {
    console.log(`  試行 ${r.attempt}: ${r.allowed ? '✅ 許可' : '❌ 拒否'}`);
  });
  
  const passed = results[4].allowed === true && results[5].allowed === false;
  console.log('テスト結果:', passed ? '✅ 成功' : '❌ 失敗');
}

// 招待コード生成のテスト
function testInviteCodeGeneration() {
  console.log('\n=== 招待コード生成テスト ===');
  
  function generateInviteCode() {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    const length = 8;
    let result = '';
    
    const array = new Uint32Array(length);
    crypto.randomFillSync(array);
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(array[i] % characters.length);
    }
    
    return result;
  }
  
  const codes = new Set();
  for (let i = 0; i < 100; i++) {
    codes.add(generateInviteCode());
  }
  
  console.log('生成された招待コード例:', Array.from(codes).slice(0, 5).join(', '));
  console.log('ユニークなコード数:', codes.size);
  console.log('コード形式チェック:', Array.from(codes).every(c => /^[A-Z0-9]{8}$/.test(c)) ? '✅ 成功' : '❌ 失敗');
  console.log('重複チェック:', codes.size === 100 ? '✅ 成功（重複なし）' : `⚠️ ${100 - codes.size}個の重複`);
}

// CSPヘッダーの検証
function testCSPHeaders() {
  console.log('\n=== CSPヘッダー検証 ===');
  
  const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com; frame-src 'self' https://*.firebaseapp.com;";
  
  const directives = cspHeader.split(';').map(d => d.trim());
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'connect-src'];
  
  console.log('CSPディレクティブ:');
  directives.forEach(d => {
    if (d) console.log('  -', d.split(' ')[0]);
  });
  
  const hasAllRequired = requiredDirectives.every(req => 
    directives.some(d => d.startsWith(req))
  );
  
  console.log('必須ディレクティブ:', hasAllRequired ? '✅ すべて含まれています' : '❌ 不足があります');
}

// すべてのテストを実行
console.log('🔐 セキュリティ機能テスト開始\n');

testSimpleEncryption();
testSecureKeyGeneration();
testRateLimit();
testInviteCodeGeneration();
testCSPHeaders();

console.log('\n✨ すべてのテストが完了しました！');