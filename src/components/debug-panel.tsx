"use client";

import { useEffect, useState } from "react";
import errorMonitor from "@/utils/error-monitor";
import { performanceBudget } from "@/features/editor/utils/performance-optimizer";

interface DebugStats {
	errors: number;
	warnings: number;
	performance: number;
	memory: number;
	fps: number;
	memoryUsage: string;
	criticalIssues: string[];
}

/**
 * Painel de debug para monitorar performance e erros em tempo real
 * Pressione Ctrl+Shift+D para mostrar/ocultar
 */
export function DebugPanel() {
	const [isVisible, setIsVisible] = useState(false);
	const [stats, setStats] = useState<DebugStats>({
		errors: 0,
		warnings: 0,
		performance: 0,
		memory: 0,
		fps: 0,
		memoryUsage: "N/A",
		criticalIssues: [],
	});

	useEffect(() => {
		// Toggle visibility com Ctrl+Shift+D
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "D") {
				setIsVisible((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		if (!isVisible) return;

		// Atualiza stats a cada 500ms
		const interval = setInterval(() => {
			const summary = errorMonitor.getErrorSummary();
			const perfMetrics = performanceBudget.getMetrics();
			const budget = performanceBudget.isOverBudget();

			// Calcula FPS estimado baseado no render time
			const estimatedFps = perfMetrics.avgRenderTime > 0 
				? Math.min(60, 1000 / perfMetrics.avgRenderTime)
				: 60;

			// Pega uso de memória se disponível
			let memoryUsage = "N/A";
			if ((performance as any).memory) {
				const memory = (performance as any).memory;
				const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(0);
				const totalMB = (memory.jsHeapSizeLimit / 1048576).toFixed(0);
				memoryUsage = `${usedMB} / ${totalMB} MB`;
			}

			// Identifica issues críticos
			const criticalIssues: string[] = [];
			if (budget.render) criticalIssues.push("Renderização lenta (< 60fps)");
			if (budget.memory) criticalIssues.push("Alto uso de memória");
			if (summary.criticalErrors.length > 0) {
				criticalIssues.push(`${summary.criticalErrors.length} erro(s) crítico(s)`);
			}

			setStats({
				errors: summary.totalErrors,
				warnings: summary.totalWarnings,
				performance: summary.performanceIssues,
				memory: summary.memoryIssues,
				fps: Math.round(estimatedFps),
				memoryUsage,
				criticalIssues,
			});

			// Registra métricas de performance
			performanceBudget.recordMemoryUsage();
		}, 500);

		return () => clearInterval(interval);
	}, [isVisible]);

	if (!isVisible) {
		return (
			<div className="fixed bottom-4 right-4 z-[9999]">
				<button
					onClick={() => setIsVisible(true)}
					className="bg-gray-900/90 backdrop-blur text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg hover:bg-gray-800 transition-colors"
					title="Show debug panel (Ctrl+Shift+D)"
				>
					🔍 Debug
				</button>
			</div>
		);
	}

	const getStatusColor = (value: number, threshold: number) => {
		if (value === 0) return "text-green-400";
		if (value < threshold) return "text-yellow-400";
		return "text-red-400";
	};

	const getFpsColor = (fps: number) => {
		if (fps >= 55) return "text-green-400";
		if (fps >= 30) return "text-yellow-400";
		return "text-red-400";
	};

	return (
		<div className="fixed bottom-4 right-4 z-[9999] bg-gray-900/95 backdrop-blur text-white p-4 rounded-lg shadow-2xl font-mono text-xs max-w-xs border border-gray-700">
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-bold text-sm">🔍 Debug Panel</h3>
				<button
					onClick={() => setIsVisible(false)}
					className="text-gray-400 hover:text-white transition-colors"
					title="Hide (Ctrl+Shift+D)"
				>
					✕
				</button>
			</div>

			<div className="space-y-2">
				{/* FPS */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">FPS:</span>
					<span className={`font-bold ${getFpsColor(stats.fps)}`}>
						{stats.fps}
					</span>
				</div>

				{/* Memória */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">Memória:</span>
					<span className="text-blue-400">{stats.memoryUsage}</span>
				</div>

				<div className="border-t border-gray-700 my-2" />

				{/* Erros */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">Erros:</span>
					<span className={getStatusColor(stats.errors, 5)}>
						{stats.errors}
					</span>
				</div>

				{/* Avisos */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">Avisos:</span>
					<span className={getStatusColor(stats.warnings, 10)}>
						{stats.warnings}
					</span>
				</div>

				{/* Performance */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">Perf. Issues:</span>
					<span className={getStatusColor(stats.performance, 5)}>
						{stats.performance}
					</span>
				</div>

				{/* Memory Issues */}
				<div className="flex justify-between items-center">
					<span className="text-gray-400">Memory Issues:</span>
					<span className={getStatusColor(stats.memory, 3)}>
						{stats.memory}
					</span>
				</div>

				{/* Critical Issues */}
				{stats.criticalIssues.length > 0 && (
					<>
						<div className="border-t border-gray-700 my-2" />
						<div className="space-y-1">
							<div className="text-red-400 font-bold">⚠️ Crítico:</div>
							{stats.criticalIssues.map((issue, i) => (
								<div key={i} className="text-red-300 text-[10px] pl-2">
									• {issue}
								</div>
							))}
						</div>
					</>
				)}
			</div>

			<div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
				<button
					onClick={() => {
						const report = errorMonitor.generateReport();
						console.log(report);
						alert("Relatório gerado no console!");
					}}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] transition-colors"
				>
					📊 Gerar Relatório
				</button>
				
				<button
					onClick={() => {
						errorMonitor.clearErrors();
						performanceBudget.getMetrics();
						alert("Estatísticas limpas!");
					}}
					className="w-full bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[10px] transition-colors"
				>
					🗑️ Limpar Stats
				</button>
			</div>

			<div className="text-[9px] text-gray-500 mt-2 text-center">
				Ctrl+Shift+D para ocultar
			</div>
		</div>
	);
}
