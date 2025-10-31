"use client";

import { useEffect } from "react";
import errorMonitor from "@/utils/error-monitor";

/**
 * Componente que inicializa o monitoramento de erros
 * Deve ser incluído no layout raiz da aplicação
 */
export function ErrorMonitorInitializer() {
	useEffect(() => {
		// Inicializa o monitor de erros
		errorMonitor.useErrorMonitor();

		// Log inicial
		console.log("🔍 Error Monitor initialized");
		console.log("💡 Type 'window.__errorMonitor.generateReport()' in console to see error report");
		console.log("💡 Type 'window.__errorMonitor.getErrorSummary()' to see summary");

		// Cleanup ao desmontar
		return () => {
			errorMonitor.destroy();
		};
	}, []);

	return null; // Não renderiza nada
}
