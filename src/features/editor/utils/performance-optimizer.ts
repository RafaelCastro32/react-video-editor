/**
 * Otimizador de Performance para Video Editor
 * Corrige problemas de travamento, memory leaks e re-renders excessivos
 */

// Debounce function otimizado
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate = false
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};

		const callNow = immediate && !timeout;
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) func(...args);
	};
}

// Throttle function otimizado
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;
	let lastResult: ReturnType<T>;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			inThrottle = true;
			lastResult = func(...args);
			setTimeout(() => (inThrottle = false), limit);
		}
		return lastResult;
	};
}

// RequestAnimationFrame throttle para scroll/render
export function rafThrottle<T extends (...args: any[]) => any>(
	func: T
): (...args: Parameters<T>) => void {
	let rafId: number | null = null;

	return function executedFunction(...args: Parameters<T>) {
		if (rafId) return;

		rafId = requestAnimationFrame(() => {
			func(...args);
			rafId = null;
		});
	};
}

// Cleanup manager para evitar memory leaks
class CleanupManager {
	private cleanupFunctions: Set<() => void> = new Set();
	private intervals: Set<NodeJS.Timeout> = new Set();
	private timeouts: Set<NodeJS.Timeout> = new Set();
	private rafIds: Set<number> = new Set();
	private objectUrls: Set<string> = new Set();

	addCleanup(cleanup: () => void) {
		this.cleanupFunctions.add(cleanup);
	}

	addInterval(interval: NodeJS.Timeout) {
		this.intervals.add(interval);
	}

	addTimeout(timeout: NodeJS.Timeout) {
		this.timeouts.add(timeout);
	}

	addRaf(rafId: number) {
		this.rafIds.add(rafId);
	}

	addObjectUrl(url: string) {
		this.objectUrls.add(url);
	}

	cleanup() {
		// Clear all intervals
		for (const interval of this.intervals) {
			clearInterval(interval);
		}
		this.intervals.clear();

		// Clear all timeouts
		for (const timeout of this.timeouts) {
			clearTimeout(timeout);
		}
		this.timeouts.clear();

		// Cancel all RAF
		for (const rafId of this.rafIds) {
			cancelAnimationFrame(rafId);
		}
		this.rafIds.clear();

		// Revoke all object URLs
		for (const url of this.objectUrls) {
			URL.revokeObjectURL(url);
		}
		this.objectUrls.clear();

		// Execute cleanup functions
		for (const cleanup of this.cleanupFunctions) {
			try {
				cleanup();
			} catch (error) {
				console.error('Cleanup function error:', error);
			}
		}
		this.cleanupFunctions.clear();
	}
}

export function createCleanupManager() {
	return new CleanupManager();
}

// Batch update manager para agrupar atualizações
class BatchUpdateManager {
	private pendingUpdates: Map<string, any> = new Map();
	private updateCallbacks: Map<string, (value: any) => void> = new Map();
	private batchTimeout: NodeJS.Timeout | null = null;
	private readonly BATCH_DELAY = 16; // ~60fps

	scheduleUpdate(key: string, value: any, callback: (value: any) => void) {
		this.pendingUpdates.set(key, value);
		this.updateCallbacks.set(key, callback);

		if (this.batchTimeout) return;

		this.batchTimeout = setTimeout(() => {
			this.flush();
		}, this.BATCH_DELAY);
	}

	flush() {
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}

		for (const [key, value] of this.pendingUpdates.entries()) {
			const callback = this.updateCallbacks.get(key);
			if (callback) {
				try {
					callback(value);
				} catch (error) {
					console.error(`Batch update error for key ${key}:`, error);
				}
			}
		}

		this.pendingUpdates.clear();
		this.updateCallbacks.clear();
	}

	cancel() {
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}
		this.pendingUpdates.clear();
		this.updateCallbacks.clear();
	}
}

export function createBatchUpdateManager() {
	return new BatchUpdateManager();
}

// Cache inteligente com LRU (Least Recently Used)
export class LRUCache<K, V> {
	private cache: Map<K, { value: V; timestamp: number }> = new Map();
	private maxSize: number;
	private ttl: number; // Time to live in milliseconds

	constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
		this.maxSize = maxSize;
		this.ttl = ttl;
	}

	get(key: K): V | undefined {
		const item = this.cache.get(key);
		if (!item) return undefined;

		// Check if expired
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return undefined;
		}

		// Update timestamp (make it recently used)
		item.timestamp = Date.now();
		return item.value;
	}

	set(key: K, value: V) {
		// Remove oldest if at capacity
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			const oldestKey = this.getOldestKey();
			if (oldestKey !== undefined) {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(key, {
			value,
			timestamp: Date.now(),
		});
	}

	has(key: K): boolean {
		const item = this.cache.get(key);
		if (!item) return false;

		// Check if expired
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: K) {
		this.cache.delete(key);
	}

	clear() {
		this.cache.clear();
	}

	private getOldestKey(): K | undefined {
		let oldestKey: K | undefined;
		let oldestTime = Infinity;

		for (const [key, item] of this.cache.entries()) {
			if (item.timestamp < oldestTime) {
				oldestTime = item.timestamp;
				oldestKey = key;
			}
		}

		return oldestKey;
	}

	// Cleanup expired entries
	cleanup() {
		const now = Date.now();
		for (const [key, item] of this.cache.entries()) {
			if (now - item.timestamp > this.ttl) {
				this.cache.delete(key);
			}
		}
	}

	getSize(): number {
		return this.cache.size;
	}
}

// Task queue para processar tarefas pesadas de forma assíncrona
export class TaskQueue {
	private queue: Array<() => Promise<void>> = [];
	private isProcessing = false;
	private maxConcurrent = 2;
	private currentlyProcessing = 0;

	add(task: () => Promise<void>) {
		this.queue.push(task);
		this.process();
	}

	private async process() {
		if (this.isProcessing || this.queue.length === 0) return;
		if (this.currentlyProcessing >= this.maxConcurrent) return;

		this.isProcessing = true;

		while (this.queue.length > 0 && this.currentlyProcessing < this.maxConcurrent) {
			const task = this.queue.shift();
			if (!task) break;

			this.currentlyProcessing++;
			
			task()
				.catch((error) => console.error('Task queue error:', error))
				.finally(() => {
					this.currentlyProcessing--;
					// Process next tasks
					requestIdleCallback(() => {
						this.isProcessing = false;
						this.process();
					});
				});
		}

		this.isProcessing = false;
	}

	clear() {
		this.queue = [];
	}

	getQueueSize(): number {
		return this.queue.length;
	}
}

// Utilidade para detectar se o dispositivo está com baixa performance
export function isLowPerformanceDevice(): boolean {
	if (typeof navigator === 'undefined') return false;

	// Check hardware concurrency (CPU cores)
	const cores = navigator.hardwareConcurrency || 0;
	if (cores < 4) return true;

	// Check available memory (if supported)
	const memory = (navigator as any).deviceMemory;
	if (memory && memory < 4) return true; // Less than 4GB

	// Check connection speed (if supported)
	const connection = (navigator as any).connection;
	if (connection) {
		const effectiveType = connection.effectiveType;
		if (effectiveType === 'slow-2g' || effectiveType === '2g') return true;
	}

	return false;
}

// Performance budget checker
export class PerformanceBudget {
	private metrics: {
		renderTime: number[];
		memoryUsage: number[];
	} = {
		renderTime: [],
		memoryUsage: [],
	};

	private readonly MAX_RENDER_TIME = 16; // 60fps = 16ms per frame
	private readonly MAX_MEMORY_MB = 500; // 500MB threshold

	recordRenderTime(time: number) {
		this.metrics.renderTime.push(time);
		// Keep only last 100 measurements
		if (this.metrics.renderTime.length > 100) {
			this.metrics.renderTime.shift();
		}
	}

	recordMemoryUsage() {
		if (!(performance as any).memory) return;

		const memory = (performance as any).memory;
		const usedMB = memory.usedJSHeapSize / 1048576;
		this.metrics.memoryUsage.push(usedMB);

		// Keep only last 100 measurements
		if (this.metrics.memoryUsage.length > 100) {
			this.metrics.memoryUsage.shift();
		}
	}

	isOverBudget(): {
		render: boolean;
		memory: boolean;
		shouldOptimize: boolean;
	} {
		const avgRenderTime =
			this.metrics.renderTime.reduce((a, b) => a + b, 0) /
			this.metrics.renderTime.length;
		const avgMemory =
			this.metrics.memoryUsage.reduce((a, b) => a + b, 0) /
			this.metrics.memoryUsage.length;

		const renderOverBudget = avgRenderTime > this.MAX_RENDER_TIME;
		const memoryOverBudget = avgMemory > this.MAX_MEMORY_MB;

		return {
			render: renderOverBudget,
			memory: memoryOverBudget,
			shouldOptimize: renderOverBudget || memoryOverBudget,
		};
	}

	getMetrics() {
		return {
			avgRenderTime:
				this.metrics.renderTime.reduce((a, b) => a + b, 0) /
				this.metrics.renderTime.length || 0,
			avgMemory:
				this.metrics.memoryUsage.reduce((a, b) => a + b, 0) /
				this.metrics.memoryUsage.length || 0,
			samples: {
				render: this.metrics.renderTime.length,
				memory: this.metrics.memoryUsage.length,
			},
		};
	}
}

export const performanceBudget = new PerformanceBudget();
