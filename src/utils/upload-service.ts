import axios from "axios";

export type UploadProgressCallback = (
	uploadId: string,
	progress: number,
) => void;

export type UploadStatusCallback = (
	uploadId: string,
	status: "uploaded" | "failed",
	error?: string,
) => void;

export interface UploadCallbacks {
	onProgress: UploadProgressCallback;
	onStatus: UploadStatusCallback;
}

export async function processFileUpload(
	uploadId: string,
	file: File,
	callbacks: UploadCallbacks,
): Promise<any> {
	try {
		// Simulate upload progress for local files
		callbacks.onProgress(uploadId, 30);

		await new Promise((resolve) => setTimeout(resolve, 100));
		callbacks.onProgress(uploadId, 60);

		await new Promise((resolve) => setTimeout(resolve, 100));
		callbacks.onProgress(uploadId, 90);

		// Create local Object URL instead of uploading to external server
		// This works completely offline
		const localUrl = URL.createObjectURL(file);

		await new Promise((resolve) => setTimeout(resolve, 100));
		callbacks.onProgress(uploadId, 100);

		// Construct upload data with local URL
		const uploadData = {
			fileName: file.name,
			filePath: localUrl, // Local Object URL
			fileSize: file.size,
			contentType: file.type,
			metadata: { uploadedUrl: localUrl, offline: true },
			folder: null,
			type: file.type.split("/")[0],
			method: "local",
			origin: "user",
			status: "uploaded",
			isPreview: false,
			file: file, // Keep file reference for local rendering
			url: localUrl,
		};

		callbacks.onStatus(uploadId, "uploaded");
		return uploadData;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		callbacks.onStatus(uploadId, "failed", errorMessage);
		console.error("File upload error:", error);
		throw error;
	}
}

export async function processUrlUpload(
	uploadId: string,
	url: string,
	callbacks: UploadCallbacks,
): Promise<any[]> {
	try {
		// For local mode, we'll use the URL directly
		// This works for public URLs that don't require CORS
		callbacks.onProgress(uploadId, 30);

		// Try to determine file type from URL
		const fileName = url.split("/").pop() || "media-file";
		let contentType = "video/mp4"; // Default

		if (url.includes(".mp4")) contentType = "video/mp4";
		else if (url.includes(".webm")) contentType = "video/webm";
		else if (url.includes(".mp3")) contentType = "audio/mp3";
		else if (url.includes(".wav")) contentType = "audio/wav";
		else if (url.includes(".jpg") || url.includes(".jpeg"))
			contentType = "image/jpeg";
		else if (url.includes(".png")) contentType = "image/png";

		callbacks.onProgress(uploadId, 70);

		const uploadData = {
			fileName: fileName,
			filePath: url,
			fileSize: 0,
			contentType: contentType,
			metadata: { originalUrl: url, offline: false },
			folder: null,
			type: contentType.split("/")[0],
			method: "url",
			origin: "user",
			status: "uploaded",
			isPreview: false,
			url: url,
		};

		callbacks.onProgress(uploadId, 100);
		callbacks.onStatus(uploadId, "uploaded");
		return [uploadData];
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		callbacks.onStatus(uploadId, "failed", errorMessage);
		console.error("URL upload error:", error);
		throw error;
	}
}

export async function processUpload(
	uploadId: string,
	upload: { file?: File; url?: string },
	callbacks: UploadCallbacks,
): Promise<any> {
	if (upload.file) {
		return await processFileUpload(uploadId, upload.file, callbacks);
	}
	if (upload.url) {
		return await processUrlUpload(uploadId, upload.url, callbacks);
	}
	callbacks.onStatus(uploadId, "failed", "No file or URL provided");
	throw new Error("No file or URL provided");
}
