// パフォーマンス計測ユーティリティ

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    before: number;
    after: number;
    delta: number;
  };
  metadata?: Record<string, any>;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, PerformanceMetric> = new Map();

  /**
   * 操作の開始を記録
   */
  startOperation(operationName: string, metadata?: Record<string, any>): string {
    // 本番環境では軽量化
    if (!__DEV__) {
      return `${operationName}_${Date.now()}`;
    }

    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      operation: operationName,
      startTime: performance.now(),
      metadata,
    };

    // メモリ使用量を計測（開発環境のみ）
    if (__DEV__ && 'memory' in performance) {
      metric.memoryUsage = {
        before: (performance as any).memory.usedJSHeapSize,
        after: 0,
        delta: 0,
      };
    }

    this.activeOperations.set(operationId, metric);
    return operationId;
  }

  /**
   * 操作の終了を記録
   */
  endOperation(operationId: string): PerformanceMetric | null {
    // 本番環境では何もしない
    if (!__DEV__) {
      return null;
    }

    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      // 警告も本番では出力しない
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // メモリ使用量を計測（開発環境のみ）
    if (metric.memoryUsage && 'memory' in performance) {
      metric.memoryUsage.after = (performance as any).memory.usedJSHeapSize;
      metric.memoryUsage.delta = metric.memoryUsage.after - metric.memoryUsage.before;
    }

    this.metrics.push(metric);
    this.activeOperations.delete(operationId);

    // ログ出力を大幅に制限（重要な操作のみ）
    if (metric.duration && metric.duration > 50) { // 50ms以上の操作のみログ
      console.log(`⚡ Slow operation: ${metric.operation}`, {
        duration: `${metric.duration.toFixed(2)}ms`,
      });
    }

    return metric;
  }

  /**
   * 関数の実行時間を計測するヘルパー
   */
  async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const operationId = this.startOperation(operationName, metadata);
    try {
      const result = await fn();
      const metric = this.endOperation(operationId)!;
      return { result, metric };
    } catch (error) {
      this.endOperation(operationId);
      throw error;
    }
  }

  /**
   * 同期関数の実行時間を計測するヘルパー
   */
  measure<T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; metric: PerformanceMetric } {
    const operationId = this.startOperation(operationName, metadata);
    try {
      const result = fn();
      const metric = this.endOperation(operationId)!;
      return { result, metric };
    } catch (error) {
      this.endOperation(operationId);
      throw error;
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(operationName?: string): {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalMemoryDelta: number;
  } {
    const filteredMetrics = operationName 
      ? this.metrics.filter(m => m.operation === operationName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalMemoryDelta: 0,
      };
    }

    const durations = filteredMetrics.map(m => m.duration || 0);
    const memoryDeltas = filteredMetrics
      .map(m => m.memoryUsage?.delta || 0)
      .filter(delta => delta !== 0);

    return {
      count: filteredMetrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalMemoryDelta: memoryDeltas.reduce((sum, d) => sum + d, 0),
    };
  }

  /**
   * パフォーマンスレポートを生成
   */
  generateReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    let report = '📊 Performance Report\n\n';

    operations.forEach(operation => {
      const stats = this.getStats(operation);
      report += `${operation}:\n`;
      report += `  Count: ${stats.count}\n`;
      report += `  Total: ${stats.totalDuration.toFixed(2)}ms\n`;
      report += `  Average: ${stats.averageDuration.toFixed(2)}ms\n`;
      report += `  Min: ${stats.minDuration.toFixed(2)}ms\n`;
      report += `  Max: ${stats.maxDuration.toFixed(2)}ms\n`;
      if (stats.totalMemoryDelta !== 0) {
        report += `  Memory: ${(stats.totalMemoryDelta / 1024 / 1024).toFixed(2)}MB\n`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * メトリクスをクリア
   */
  clear(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  /**
   * すべてのメトリクスを取得
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// グローバルインスタンス
export const performanceTracker = new PerformanceTracker();

// React用のHook
export const usePerformanceTracker = () => {
  return {
    startOperation: performanceTracker.startOperation.bind(performanceTracker),
    endOperation: performanceTracker.endOperation.bind(performanceTracker),
    measureAsync: performanceTracker.measureAsync.bind(performanceTracker),
    measure: performanceTracker.measure.bind(performanceTracker),
    getStats: performanceTracker.getStats.bind(performanceTracker),
    generateReport: performanceTracker.generateReport.bind(performanceTracker),
    clear: performanceTracker.clear.bind(performanceTracker),
  };
};