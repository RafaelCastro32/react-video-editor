import { NextRequest, NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

export async function POST(request: NextRequest) {
	const tmpDir = path.join(os.tmpdir(), `remotion-${Date.now()}`);

	try {
		const body = await request.json();
		const { projectData, fps = 30, width = 1080, height = 1920 } = body;

		if (!projectData) {
			return NextResponse.json(
				{ error: "projectData is required" },
				{ status: 400 },
			);
		}

		// Create temporary directory
		fs.mkdirSync(tmpDir, { recursive: true });

		console.log("Starting local render...");
		console.log("Project data:", JSON.stringify(projectData, null, 2));

		// Bundle the Remotion project
		// Note: This requires the composition to be in a separate entry file
		const bundleLocation = await bundle({
			entryPoint: path.join(
				process.cwd(),
				"src/features/editor/player/index.ts",
			),
			webpackOverride: (config) => config,
		});

		console.log("Bundle created at:", bundleLocation);

		// Get composition
		const composition = await selectComposition({
			serveUrl: bundleLocation,
			id: "main", // Your composition ID
			inputProps: projectData,
		});

		console.log("Composition selected:", composition);

		// Output path
		const outputPath = path.join(tmpDir, "output.mp4");

		// Render the video
		await renderMedia({
			composition,
			serveUrl: bundleLocation,
			codec: "h264",
			outputLocation: outputPath,
			inputProps: projectData,
			onProgress: ({ progress }) => {
				console.log(`Rendering progress: ${(progress * 100).toFixed(2)}%`);
			},
		});

		console.log("Render complete:", outputPath);

		// Read the file
		const videoBuffer = fs.readFileSync(outputPath);

		// Clean up
		fs.rmSync(tmpDir, { recursive: true, force: true });

		// Return the video file
		return new NextResponse(videoBuffer, {
			status: 200,
			headers: {
				"Content-Type": "video/mp4",
				"Content-Disposition": `attachment; filename="video-${Date.now()}.mp4"`,
				"Content-Length": videoBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("Render error:", error);

		// Clean up on error
		if (fs.existsSync(tmpDir)) {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}

		return NextResponse.json(
			{
				error: "Render failed",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
