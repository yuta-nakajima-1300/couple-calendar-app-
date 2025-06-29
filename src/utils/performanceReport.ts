// パフォーマンス最適化効果のレポート生成

import { performanceTracker } from './performanceTracker';
import { calendarCache } from './calendarCache';

export interface OptimizationReport {
  timestamp: string;
  summary: {
    totalOperations: number;
    averageProcessingTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
  operationBreakdown: Array<{
    operation: string;
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }>;
  cacheStatistics: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  recommendations: string[];
}

export function generateOptimizationReport(): OptimizationReport {
  const allMetrics = performanceTracker.getAllMetrics();
  const cacheStats = calendarCache.getStats();
  
  // 操作別の統計を生成
  const operationMap = new Map<string, number[]>();
  
  allMetrics.forEach(metric => {
    if (metric.duration !== undefined) {
      if (!operationMap.has(metric.operation)) {
        operationMap.set(metric.operation, []);
      }
      operationMap.get(metric.operation)!.push(metric.duration);
    }
  });

  const operationBreakdown = Array.from(operationMap.entries()).map(([operation, times]) => ({
    operation,
    count: times.length,
    totalTime: times.reduce((sum, time) => sum + time, 0),
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  }));

  // 全体的な統計
  const totalDurations = allMetrics
    .map(m => m.duration || 0)
    .filter(d => d > 0);
  
  const averageProcessingTime = totalDurations.length > 0 
    ? totalDurations.reduce((sum, d) => sum + d, 0) / totalDurations.length 
    : 0;

  // メモリ使用量（可能な場合）
  let memoryUsage = 0;
  if ('memory' in performance) {
    memoryUsage = (performance as any).memory.usedJSHeapSize;
  }

  // 推奨事項を生成
  const recommendations: string[] = [];
  
  if (cacheStats.hitRate < 0.7 && cacheStats.hits + cacheStats.misses > 10) {
    recommendations.push('キャッシュ命中率が低いです。キャッシュサイズまたは有効期限の調整を検討してください。');
  }
  
  if (averageProcessingTime > 50) {
    recommendations.push('平均処理時間が50ms以上です。さらなる最適化を検討してください。');
  }
  
  const calendarOperations = operationBreakdown.filter(op => 
    op.operation.includes('calendar') || op.operation.includes('Calendar')
  );
  
  if (calendarOperations.length > 0) {
    const maxCalendarTime = Math.max(...calendarOperations.map(op => op.maxTime));
    if (maxCalendarTime > 100) {
      recommendations.push('カレンダー処理の最大時間が100ms以上です。非同期処理の分割を検討してください。');
    }
  }

  if (cacheStats.size > 40) {
    recommendations.push('キャッシュサイズが大きくなっています。メモリ使用量を監視してください。');
  }

  if (recommendations.length === 0) {
    recommendations.push('パフォーマンスは良好です。現在の最適化レベルを維持してください。');
  }

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalOperations: allMetrics.length,
      averageProcessingTime,
      cacheHitRate: cacheStats.hitRate,
      memoryUsage,
    },
    operationBreakdown,
    cacheStatistics: cacheStats,
    recommendations,
  };
}

export function formatOptimizationReport(report: OptimizationReport): string {
  let output = '📊 パフォーマンス最適化レポート\n';
  output += `生成時刻: ${new Date(report.timestamp).toLocaleString('ja-JP')}\n\n`;
  
  output += '📈 サマリー\n';
  output += `  総操作数: ${report.summary.totalOperations}\n`;
  output += `  平均処理時間: ${report.summary.averageProcessingTime.toFixed(2)}ms\n`;
  output += `  キャッシュ命中率: ${(report.summary.cacheHitRate * 100).toFixed(1)}%\n`;
  if (report.summary.memoryUsage > 0) {
    output += `  メモリ使用量: ${(report.summary.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
  }
  output += '\n';

  output += '🔍 操作別詳細\n';
  report.operationBreakdown
    .sort((a, b) => b.totalTime - a.totalTime)
    .forEach(op => {
      output += `  ${op.operation}:\n`;
      output += `    回数: ${op.count}, 合計: ${op.totalTime.toFixed(2)}ms\n`;
      output += `    平均: ${op.averageTime.toFixed(2)}ms, 最大: ${op.maxTime.toFixed(2)}ms\n`;
    });
  output += '\n';

  output += '💾 キャッシュ統計\n';
  output += `  ヒット: ${report.cacheStatistics.hits}\n`;
  output += `  ミス: ${report.cacheStatistics.misses}\n`;
  output += `  サイズ: ${report.cacheStatistics.size}\n`;
  output += `  命中率: ${(report.cacheStatistics.hitRate * 100).toFixed(1)}%\n\n`;

  output += '💡 推奨事項\n';
  report.recommendations.forEach((rec, index) => {
    output += `  ${index + 1}. ${rec}\n`;
  });

  return output;
}

export function logOptimizationReport(): void {
  const report = generateOptimizationReport();
  const formattedReport = formatOptimizationReport(report);
  console.log(formattedReport);
  return;
}

// ブラウザの開発者ツールで呼び出せるグローバル関数
if (typeof window !== 'undefined' && __DEV__) {
  (window as any).logCalendarPerformance = logOptimizationReport;
  (window as any).getCalendarPerformanceReport = generateOptimizationReport;
}