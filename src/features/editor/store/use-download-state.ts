import { IDesign } from "@designcombo/types";
import { create } from "zustand";
import { recordPlayerRealtime, downloadBlob } from "@/utils/local-renderer";

interface Output {
	url: string;
	type: string;
}

interface DownloadState {
	projectId: string;
	exporting: boolean;
	exportType: "json" | "mp4";
	exportMode: "cloud" | "local"; // New: export mode
	progress: number;
	output?: Output;
	payload?: IDesign;
	displayProgressModal: boolean;
	playerRef?: React.RefObject<any>; // New: player reference for local rendering
	actions: {
		setProjectId: (projectId: string) => void;
		setExporting: (exporting: boolean) => void;
		setExportType: (exportType: "json" | "mp4") => void;
		setExportMode: (mode: "cloud" | "local") => void; // New
		setProgress: (progress: number) => void;
		setState: (state: Partial<DownloadState>) => void;
		setOutput: (output: Output) => void;
		startExport: () => void;
		startLocalExport: () => void; // New: local export
		setDisplayProgressModal: (displayProgressModal: boolean) => void;
		setPlayerRef: (playerRef: React.RefObject<any>) => void; // New
	};
}

//const baseUrl = "https://api.combo.sh/v1";

export const useDownloadState = create<DownloadState>((set, get) => ({
	projectId: "",
	exporting: false,
	exportType: "mp4",
	exportMode: "local", // Default to local for offline support
	progress: 0,
	displayProgressModal: false,
	playerRef: undefined,
	actions: {
		setProjectId: (projectId) => set({ projectId }),
		setExporting: (exporting) => set({ exporting }),
		setExportType: (exportType) => set({ exportType }),
		setExportMode: (mode) => set({ exportMode: mode }),
		setProgress: (progress) => set({ progress }),
		setState: (state) => set({ ...state }),
		setOutput: (output) => set({ output }),
		setDisplayProgressModal: (displayProgressModal) =>
			set({ displayProgressModal }),
		setPlayerRef: (playerRef) => set({ playerRef }),

		// New: Local export using browser recording
		startLocalExport: async () => {
			try {
				const { playerRef } = get();

				if (!playerRef || !playerRef.current) {
					throw new Error("Player reference not available");
				}

				set({ exporting: true, displayProgressModal: true, progress: 0 });

				await recordPlayerRealtime({
					playerRef,
					onProgress: (progress) => {
						set({ progress });
					},
					onComplete: (blob) => {
						const filename = `video-${Date.now()}.webm`;
						downloadBlob(blob, filename);

						set({
							exporting: false,
							progress: 100,
							output: {
								url: URL.createObjectURL(blob),
								type: "webm",
							},
						});
					},
					onError: (error) => {
						console.error("Local export failed:", error);
						alert(`Export failed: ${error.message}`);
						set({ exporting: false, progress: 0 });
					},
				});
			} catch (error) {
				console.error("Local export error:", error);
				alert(`Export error: ${(error as Error).message}`);
				set({ exporting: false, progress: 0 });
			}
		},

		startExport: async () => {
			try {
				// Set exporting to true at the start
				set({ exporting: true, displayProgressModal: true });

				// Assume payload to be stored in the state for POST request
				const { payload } = get();

				if (!payload) throw new Error("Payload is not defined");

				// Step 1: POST request to start rendering
				const response = await fetch(`/api/render`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						design: payload,
						options: {
							fps: 30,
							size: payload.size,
							format: "mp4",
						},
					}),
				});

				if (!response.ok) throw new Error("Failed to submit export request.");

				const jobInfo = await response.json();
				const jobId = jobInfo.render.id;

				// Step 2 & 3: Polling for status updates
				const checkStatus = async () => {
					const statusResponse = await fetch(`/api/render/${jobId}`, {
						headers: {
							"Content-Type": "application/json",
						},
					});

					if (!statusResponse.ok)
						throw new Error("Failed to fetch export status.");

					const statusInfo = await statusResponse.json();
					const { status, progress, presigned_url: url } = statusInfo.render;

					set({ progress });

					if (status === "COMPLETED") {
						set({ exporting: false, output: { url, type: get().exportType } });
					} else if (status === "PROCESSING" || status === "PENDING") {
						setTimeout(checkStatus, 2500);
					}
				};

				checkStatus();
			} catch (error) {
				console.error(error);
				set({ exporting: false });
			}
		},
	},
}));
