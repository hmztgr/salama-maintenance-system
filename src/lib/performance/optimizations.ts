// Performance optimization utilities for Firebase operations
// Includes caching, pagination, and query optimization strategies

import { QueryConstraint, limit, startAfter, orderBy, where, DocumentSnapshot } from 'firebase/firestore';

// Cache configuration
export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // maximum items in cache
}

// Pagination interface
export interface PaginationConfig {
  pageSize: number;
  lastDoc?: DocumentSnapshot;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  totalCount?: number;
}

// In-memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxAge: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  set(key: string, data: T): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global caches for different data types
export const companiesCache = new MemoryCache<any[]>({ maxAge: 10 * 60 * 1000, maxSize: 50 });
export const contractsCache = new MemoryCache<any[]>({ maxAge: 10 * 60 * 1000, maxSize: 100 });
export const branchesCache = new MemoryCache<any[]>({ maxAge: 10 * 60 * 1000, maxSize: 200 });
export const visitsCache = new MemoryCache<any[]>({ maxAge: 5 * 60 * 1000, maxSize: 500 });

// Query optimization utilities
export class QueryOptimizer {
  // Generate optimized cache key for queries
  static generateCacheKey(collection: string, constraints: any[] = []): string {
    const constraintStr = constraints.map(c => JSON.stringify(c)).join('|');
    return `${collection}:${constraintStr}`;
  }

  // Optimize query constraints for better performance
  static optimizeConstraints(constraints: QueryConstraint[]): QueryConstraint[] {
    const optimized: QueryConstraint[] = [];
    
    // Add order by first for better index utilization
    const orderByConstraints = constraints.filter(c => c.type === 'orderBy');
    const otherConstraints = constraints.filter(c => c.type !== 'orderBy');
    
    optimized.push(...orderByConstraints);
    optimized.push(...otherConstraints);
    
    return optimized;
  }

  // Create pagination constraints
  static createPaginationConstraints(config: PaginationConfig): QueryConstraint[] {
    const constraints: QueryConstraint[] = [limit(config.pageSize)];
    
    if (config.lastDoc) {
      constraints.push(startAfter(config.lastDoc));
    }
    
    return constraints;
  }

  // Create filter constraints with optimization
  static createFilterConstraints(filters: Record<string, any>): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    
    // Sort filters by selectivity (most selective first)
    const sortedFilters = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => {
        // Prioritize equality filters over range filters
        const aIsEquality = typeof filters[a] === 'string' || typeof filters[a] === 'number';
        const bIsEquality = typeof filters[b] === 'string' || typeof filters[b] === 'number';
        
        if (aIsEquality && !bIsEquality) return -1;
        if (!aIsEquality && bIsEquality) return 1;
        return 0;
      });
    
    sortedFilters.forEach(([field, value]) => {
      if (Array.isArray(value)) {
        constraints.push(where(field, 'in', value));
      } else if (typeof value === 'object' && value.start && value.end) {
        constraints.push(where(field, '>=', value.start));
        constraints.push(where(field, '<=', value.end));
      } else {
        constraints.push(where(field, '==', value));
      }
    });
    
    return constraints;
  }
}

// Batch operations for better performance
export class BatchProcessor {
  private batchSize: number;
  
  constructor(batchSize: number = 500) {
    this.batchSize = batchSize;
  }

  // Process array in batches
  async processBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Debounced search for better UX
export class DebouncedSearch {
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;
  
  constructor(delay: number = 300) {
    this.delay = delay;
  }
  
  search<T>(
    searchFn: () => Promise<T>,
    callback: (result: T) => void
  ): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(async () => {
      try {
        const result = await searchFn();
        callback(result);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, this.delay);
  }
  
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();
  
  static startMeasurement(key: string): string {
    const measurementId = `${key}-${Date.now()}-${Math.random()}`;
    performance.mark(`${measurementId}-start`);
    return measurementId;
  }
  
  static endMeasurement(measurementId: string): number {
    performance.mark(`${measurementId}-end`);
    performance.measure(measurementId, `${measurementId}-start`, `${measurementId}-end`);
    
    const measure = performance.getEntriesByName(measurementId)[0];
    const duration = measure.duration;
    
    // Store measurement for analysis
    const key = measurementId.split('-')[0];
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    this.measurements.get(key)!.push(duration);
    
    // Clean up performance entries
    performance.clearMarks(`${measurementId}-start`);
    performance.clearMarks(`${measurementId}-end`);
    performance.clearMeasures(measurementId);
    
    return duration;
  }
  
  static getAverageTime(key: string): number {
    const measurements = this.measurements.get(key) || [];
    if (measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }
  
  static getStats(key: string): { avg: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(key) || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }
}

// Connection monitoring for offline support
export class ConnectionMonitor {
  private isOnline = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];
  
  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }
  
  getStatus(): boolean {
    return this.isOnline;
  }
  
  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }
}

// Export singleton instances
export const batchProcessor = new BatchProcessor();
export const debouncedSearch = new DebouncedSearch();
export const connectionMonitor = new ConnectionMonitor();

// Utility functions
export const clearAllCaches = (): void => {
  companiesCache.clear();
  contractsCache.clear();
  branchesCache.clear();
  visitsCache.clear();
};

export const getCacheStats = () => ({
  companies: companiesCache.size(),
  contracts: contractsCache.size(),
  branches: branchesCache.size(),
  visits: visitsCache.size(),
});

export default {
  QueryOptimizer,
  BatchProcessor,
  DebouncedSearch,
  PerformanceMonitor,
  ConnectionMonitor,
  clearAllCaches,
  getCacheStats,
}; 