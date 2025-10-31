/**
 * Sistema Inteligente de Monitoramento de Erros
 * Detecta, agrupa e reporta problemas de performance e erros
 */

interface ErrorEntry {
	type: 'error' | 'warning' | 'performance' | 'memory';
	message: string;
	stack?: string;
	count: number;
	firstOccurrence: number;
	lastOccurrence: number;
	metadata?: Record<string, any>;
}

interface PerformanceMetrics {
	frameDrops: number;
	slowRenders: number;
	memoryLeaks: number;
	avgRenderTime: number;
	renderTimes: number[];
}

class ErrorMonitor {
	private errors: Map<string, ErrorEntry> = new Map();
	private metrics: PerformanceMetrics = {
		frameDrops: 0,
		slowRenders: 0,
		memoryLeaks: 0,
		avgRenderTime: 0,
		renderTimes: [],
	};
	private isMonitoring = false;
	private performanceObserver: PerformanceObserver | null = null;
	private memoryCheckInterval: NodeJS.Timeout | null = null;

	constructor() {
		if (typeof window === 'undefined') return;
		this.init();
	}

	private init() {
		// Captura erros globais
		window.addEventListener('error', (event) => {
			this.logError({
				type: 'error',
				message: event.message,
				stack: event.error?.stack,
				metadata: {
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
				},
			});
		});

		// Captura promessas rejeitadas
		window.addEventListener('unhandledrejection', (event) => {
			this.logError({
				type: 'error',
				message: `Unhandled Promise Rejection: ${event.reason}`,
				stack: event.reason?.stack,
			});
		});

		// Monitora console.error e console.warn
		this.interceptConsole();

		// Monitora performance
		this.setupPerformanceMonitoring();

		// Monitora memória
		this.setupMemoryMonitoring();
	}

	private interceptConsole() {
		const originalError = console.error;
		const originalWarn = console.warn;

		console.error = (...args) => {
			this.logError({
				type: 'error',
				message: args.join(' '),
			});
			originalError.apply(console, args);
		};

		console.warn = (...args) => {
			this.logError({
				type: 'warning',
				message: args.join(' '),
			});
			originalWarn.apply(console, args);
		};
	}

	private setupPerformanceMonitoring() {
		if (!window.PerformanceObserver) return;

		// Monitora long tasks (tarefas longas que travam a UI)
		try {
			this.performanceObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.duration > 50) { // Tarefas > 50ms são problemáticas
						this.metrics.slowRenders++;
						this.logError({
							type: 'performance',
							message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
							metadata: {
								duration: entry.duration,
								name: entry.name,
								entryType: entry.entryType,
							},
						});
					}
				}
			});

			this.performanceObserver.observe({ entryTypes: ['longtask', 'measure'] });
		} catch (error) {
			console.log('PerformanceObserver not supported for longtask');
		}
	}

	private setupMemoryMonitoring() {
		if (!(performance as any).memory) return;

		this.memoryCheckInterval = setInterval(() => {
			const memory = (performance as any).memory;
			const usedMB = memory.usedJSHeapSize / 1048576;
			const totalMB = memory.totalJSHeapSize / 1048576;
			const limitMB = memory.jsHeapSizeLimit / 1048576;

			// Alerta se usar mais de 80% da memória disponível
			if (usedMB / limitMB > 0.8) {
				this.metrics.memoryLeaks++;
				this.logError({
					type: 'memory',
					message: `High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${((usedMB / limitMB) * 100).toFixed(1)}%)`,
					metadata: {
						used: usedMB,
						total: totalMB,
						limit: limitMB,
						percentage: (usedMB / limitMB) * 100,
					},
				});
			}
		}, 5000); // Check every 5 seconds
	}

	private logError(error: Omit<ErrorEntry, 'count' | 'firstOccurrence' | 'lastOccurrence'>) {
		const key = `${error.type}:${error.message}`;
		const now = Date.now();
		
		if (this.errors.has(key)) {
			const existing = this.errors.get(key)!;
			existing.count++;
			existing.lastOccurrence = now;
			existing.metadata = { ...existing.metadata, ...error.metadata };
		} else {
			this.errors.set(key, {
				...error,
				count: 1,
				firstOccurrence: now,
				lastOccurrence: now,
			});
		}
	}

	// Métodos públicos para análise
	public getErrorSummary() {
		const summary = {
			totalErrors: 0,
			totalWarnings: 0,
			performanceIssues: 0,
			memoryIssues: 0,
			criticalErrors: [] as ErrorEntry[],
			frequentErrors: [] as ErrorEntry[],
			metrics: this.metrics,
		};

		for (const error of this.errors.values()) {
			switch (error.type) {
				case 'error':
					summary.totalErrors += error.count;
					break;
				case 'warning':
					summary.totalWarnings += error.count;
					break;
				case 'performance':
					summary.performanceIssues += error.count;
					break;
				case 'memory':
					summary.memoryIssues += error.count;
					break;
			}

			// Identifica erros críticos (MP4Clip timeout, etc)
			if (
				error.message.includes('MP4Clip') ||
				error.message.includes('timeout') ||
				error.message.includes('memory') ||
				error.message.includes('freeze')
			) {
				summary.criticalErrors.push(error);
			}

			// Identifica erros frequentes (> 5 ocorrências)
			if (error.count > 5) {
				summary.frequentErrors.push(error);
			}
		}

		return summary;
	}

	public getTopErrors(limit = 10) {
		return Array.from(this.errors.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, limit);
	}

	public getRecentErrors(minutes = 5) {
		const cutoff = Date.now() - minutes * 60 * 1000;
		return Array.from(this.errors.values())
			.filter((error) => error.lastOccurrence > cutoff)
			.sort((a, b) => b.lastOccurrence - a.lastOccurrence);
	}

	public generateReport(): string {
		const summary = this.getErrorSummary();
		const topErrors = this.getTopErrors(5);

		let report = '\n=== 🔍 RELATÓRIO DE ANÁLISE DO SISTEMA ===\n\n';
		
		report += '📊 RESUMO:\n';
		report += `  • Erros: ${summary.totalErrors}\n`;
		report += `  • Avisos: ${summary.totalWarnings}\n`;
		report += `  • Problemas de Performance: ${summary.performanceIssues}\n`;
		report += `  • Problemas de Memória: ${summary.memoryIssues}\n`;
		report += `  • Renders Lentos: ${summary.metrics.slowRenders}\n\n`;

		if (summary.criticalErrors.length > 0) {
			report += '🔴 ERROS CRÍTICOS:\n';
			for (const error of summary.criticalErrors) {
				report += `  • ${error.message} (${error.count}x)\n`;
				if (error.metadata) {
					report += `    Detalhes: ${JSON.stringify(error.metadata, null, 2)}\n`;
				}
			}
			report += '\n';
		}

		if (summary.frequentErrors.length > 0) {
			report += '⚠️  ERROS FREQUENTES:\n';
			for (const error of summary.frequentErrors) {
				report += `  • ${error.message} (${error.count}x)\n`;
			}
			report += '\n';
		}

		report += '📈 TOP 5 ERROS:\n';
		for (const error of topErrors) {
			const time = new Date(error.lastOccurrence).toLocaleTimeString();
			report += `  • [${error.type.toUpperCase()}] ${error.message}\n`;
			report += `    Ocorrências: ${error.count}x | Última: ${time}\n`;
		}

		report += '\n=== FIM DO RELATÓRIO ===\n';
		return report;
	}

	public clearErrors() {
		this.errors.clear();
		this.metrics = {
			frameDrops: 0,
			slowRenders: 0,
			memoryLeaks: 0,
			avgRenderTime: 0,
			renderTimes: [],
		};
	}

	public destroy() {
		if (this.performanceObserver) {
			this.performanceObserver.disconnect();
		}
		if (this.memoryCheckInterval) {
			clearInterval(this.memoryCheckInterval);
		}
	}

	// Hook React para usar no DevTools
	public useErrorMonitor() {
		if (typeof window !== 'undefined') {
			(window as any).__errorMonitor = this;
			console.log('🔍 Error Monitor ativo! Use window.__errorMonitor.generateReport() para ver o relatório');
		}
	}
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// Expõe no window para debug
if (typeof window !== 'undefined') {
	(window as any).__errorMonitor = errorMonitor;
	errorMonitor.useErrorMonitor();
}

export default errorMonitor;
