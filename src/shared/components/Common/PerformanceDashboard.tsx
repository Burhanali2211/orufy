import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performance';
import { globalResourceManager } from '../../utils/resourceManager';
import { globalCircuitBreaker, globalOfflineQueue } from '../../utils/networkResilience';

interface PerformanceData {
  metrics: any;
  detailedMetrics: any;
  resourceMetrics: any;
  circuitBreakerState: any;
  offlineQueueStatus: any;
}

const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    metrics: {},
    detailedMetrics: {},
    resourceMetrics: {},
    circuitBreakerState: {},
    offlineQueueStatus: {}
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePerformanceData = () => {
      const newData = {
        metrics: performanceMonitor.getPerformanceSummary(),
        detailedMetrics: performanceMonitor.getDetailedMetrics(),
        resourceMetrics: globalResourceManager.getMetrics(),
        circuitBreakerState: globalCircuitBreaker.getState(),
        offlineQueueStatus: globalOfflineQueue.getQueueStatus()
      };
      
      setPerformanceData(newData);
      
      // Keep last 10 data points for trend analysis
      setHistoricalData(prev => {
        const updated = [...prev, { ...newData.detailedMetrics, timestamp: Date.now() }];
        return updated.length > 10 ? updated.slice(-10) : updated;
      });
    };

    // Update immediately
    updatePerformanceData();

    // Update every 5 seconds
    const interval = setInterval(updatePerformanceData, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        📊 Performance
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Performance Dashboard</h3>
        <button
          onClick={toggleVisibility}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Core Web Vitals</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-sm text-gray-600">LCP</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.lcp ? `${Math.round(performanceData.detailedMetrics.lcp)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;2500ms</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-sm text-gray-600">FID</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.fid ? `${Math.round(performanceData.detailedMetrics.fid)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;100ms</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="text-sm text-gray-600">CLS</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.cls ? performanceData.detailedMetrics.cls.toFixed(3) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;0.1</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="text-sm text-gray-600">FCP</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.fcp ? `${Math.round(performanceData.detailedMetrics.fcp)}ms` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;1800ms</div>
          </div>
        </div>
      </div>

      {/* Resource Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Resource Manager</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Active Requests</div>
            <div className="font-bold">{performanceData.resourceMetrics.activeRequests || 0}</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Queued Requests</div>
            <div className="font-bold">{performanceData.resourceMetrics.queuedRequests || 0}</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="font-bold">{performanceData.resourceMetrics.completedRequests || 0}</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="font-bold">{performanceData.resourceMetrics.failedRequests || 0}</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="font-bold">{performanceData.resourceMetrics.successRate ? `${Math.round(performanceData.resourceMetrics.successRate)}%` : '100%'}</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded">
            <div className="text-sm text-gray-600">Retries</div>
            <div className="font-bold">{performanceData.resourceMetrics.retryCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Network Resilience */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Network Resilience</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm text-gray-600">Circuit State</div>
            <div className="font-bold capitalize">{performanceData.circuitBreakerState.state || 'closed'}</div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm text-gray-600">Failures</div>
            <div className="font-bold">{performanceData.circuitBreakerState.failures || 0}</div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm text-gray-600">Offline Queue</div>
            <div className="font-bold">{performanceData.offlineQueueStatus.queueLength || 0}</div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm text-gray-600">Avg Response</div>
            <div className="font-bold">
              {performanceData.circuitBreakerState.metrics?.averageResponseTime 
                ? `${Math.round(performanceData.circuitBreakerState.metrics.averageResponseTime)}ms` 
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Image Performance */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Image Performance</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-teal-50 p-2 rounded">
            <div className="text-sm text-gray-600">Load Time</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.imageLoadTime 
                ? `${Math.round(performanceData.detailedMetrics.imageLoadTime)}ms` 
                : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;3000ms</div>
          </div>
          <div className="bg-teal-50 p-2 rounded">
            <div className="text-sm text-gray-600">Slow Resources</div>
            <div className="font-bold">{performanceData.detailedMetrics.slowResourcesCount || 0}</div>
            <div className="text-xs text-gray-500">&gt;1000ms</div>
          </div>
          <div className="bg-teal-50 p-2 rounded">
            <div className="text-sm text-gray-600">Total Resources</div>
            <div className="font-bold">{performanceData.detailedMetrics.totalResources || 0}</div>
          </div>
          <div className="bg-teal-50 p-2 rounded">
            <div className="text-sm text-gray-600">Failed Requests</div>
            <div className="font-bold">{performanceData.detailedMetrics.failedRequests || 0}</div>
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Cache Performance</h4>
        <div className="bg-orange-50 p-2 rounded">
          <div className="text-sm text-gray-600">Hit Rate</div>
          <div className="font-bold">
            {performanceData.detailedMetrics.cacheHitRate 
              ? `${Math.round(performanceData.detailedMetrics.cacheHitRate)}%` 
              : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Target: &gt;80%</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Additional Metrics</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-gray-600">TTFB</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.ttfb 
                ? `${Math.round(performanceData.detailedMetrics.ttfb)}ms` 
                : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;800ms</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-gray-600">DOM Loaded</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.domContentLoaded 
                ? `${Math.round(performanceData.detailedMetrics.domContentLoaded)}ms` 
                : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-gray-600">Window Load</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.windowLoadTime 
                ? `${Math.round(performanceData.detailedMetrics.windowLoadTime)}ms` 
                : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-gray-600">Long Tasks</div>
            <div className="font-bold">
              {performanceData.detailedMetrics.longTasks || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Request Distribution */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Request Distribution</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-50 p-2 rounded">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="font-bold">
              {performanceData.resourceMetrics.requestDistribution?.critical || 0}
            </div>
          </div>
          <div className="bg-orange-50 p-2 rounded">
            <div className="text-sm text-gray-600">High</div>
            <div className="font-bold">
              {performanceData.resourceMetrics.requestDistribution?.high || 0}
            </div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="text-sm text-gray-600">Normal</div>
            <div className="font-bold">
              {performanceData.resourceMetrics.requestDistribution?.normal || 0}
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-sm text-gray-600">Low</div>
            <div className="font-bold">
              {performanceData.resourceMetrics.requestDistribution?.low || 0}
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-sm text-gray-600">Background</div>
            <div className="font-bold">
              {performanceData.resourceMetrics.requestDistribution?.background || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => performanceMonitor.clearMetrics()}
          className="flex-1 bg-gray-200 text-gray-800 py-1 px-2 rounded text-sm hover:bg-gray-300 transition-colors"
        >
          Clear Metrics
        </button>
        <button
          onClick={() => {
          }}
          className="flex-1 bg-gray-200 text-gray-800 py-1 px-2 rounded text-sm hover:bg-gray-300 transition-colors"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
};

export default PerformanceDashboard;