import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useStore from "../store/use-store";
import { ITrackItem, ITrackItemsMap } from "@designcombo/types";
import { Loader2, Upload } from "lucide-react";
import { generateId } from "@designcombo/timeline";
import { loadFonts } from "../utils/fonts";
import { dispatch } from "@designcombo/events";
import { ADD_ITEMS } from "@designcombo/state";

export const Subtitles = () => {
	const { trackItemsMap } = useStore();
	const [selectMediaItems, setSelectMediaItems] = useState<
		{ label: string; value: string }[]
	>([]);
	const [selectedMedia, setSelectedMedia] = useState<string | undefined>();
	const [mediaTrackItems, setMediaTrackItems] = useState<ITrackItem[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isImporting, setIsImporting] = useState(false);

	useEffect(() => {
		const mediaTrackItems = fetchMediaTrackItems(trackItemsMap);
		setMediaTrackItems(mediaTrackItems);

		const selectMediaOptions = createSelectMediaOptions(mediaTrackItems);
		setSelectMediaItems(selectMediaOptions);

		// no-op: we don't need grouping here, import is one-shot
	}, [trackItemsMap]);

	// Auto-select media when there's only one option, or if previous selection disappeared
	useEffect(() => {
		if (mediaTrackItems.length === 1 && !selectedMedia) {
			const only = mediaTrackItems[0];
			if (only?.details?.src) setSelectedMedia(only.details.src);
			return;
		}
		if (selectedMedia) {
			const stillExists = mediaTrackItems.some(
				(m) => m.details?.src === selectedMedia,
			);
			if (!stillExists && mediaTrackItems[0]?.details?.src) {
				setSelectedMedia(mediaTrackItems[0].details.src);
			}
		}
	}, [mediaTrackItems, selectedMedia]);

	const handleSelectChange = (value: string) => {
		setSelectedMedia(value);
	};

	// Generate a consistent color from a string
	const stringToColor = (str: string): string => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Generate a pleasant, distinguishable color (avoiding too dark or too bright)
		const hue = Math.abs(hash % 360);
		const saturation = 45 + (Math.abs(hash) % 15); // 45-60%
		const lightness = 35 + (Math.abs(hash >> 8) % 10); // 35-45%

		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	};

	const handleSrtUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Ensure a media is selected to align captions on the correct timeline
		if (!selectedMedia) {
			toast.error("Select a video or audio before uploading SRT");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		// Find the selected media track to compute timeline offset
		const parentTrackItem = mediaTrackItems.find(
			(m) => m.details?.src === selectedMedia,
		);

		if (!parentTrackItem) {
			toast.error("Selected media not found on timeline");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (!file.name.endsWith(".srt")) {
			toast.error("Please upload a valid SRT file");
			return;
		}

		const loadingToast = toast.loading("Processing SRT file...");

		try {
			const text = await file.text();
			const captions = parseSrtFile(text);

			// Generate unique color and group ID for this SRT file
			const groupId = `srt-${Date.now()}-${generateId()}`;
			const groupColor = stringToColor(file.name + Date.now());

			if (captions.length === 0) {
				toast.dismiss(loadingToast);
				toast.error("No captions found in SRT file");
				return;
			}

			if (captions.length > 1500) {
				toast.dismiss(loadingToast);
				toast.error(`Too many captions (${captions.length}). Maximum is 1500.`);
				return;
			}

			const fontInfo = {
				fontFamily: "theboldfont",
				fontUrl: "https://cdn.designcombo.dev/fonts/the-bold-font.ttf",
				fontSize: 64,
			};

			await loadFonts([{ name: fontInfo.fontFamily, url: fontInfo.fontUrl }]);

			const offset = parentTrackItem.display?.from || 0;

			const captionItems = captions
				.filter((c) => c.endMs > c.startMs)
				.map((caption) => {
					const cleanedText = caption.text.replace(/\{\\an\d\}/g, "").trim();
					const textWords = cleanedText.split(/\s+/).filter(Boolean);

					const absStart = offset + caption.startMs;
					const absEnd = offset + caption.endMs;
					const clampedFrom = Math.max(absStart, parentTrackItem.display.from);
					const clampedTo = Math.min(
						absEnd,
						parentTrackItem.display.to ?? absEnd,
					);
					if (!(clampedTo > clampedFrom)) return null;

					const duration = Math.max(50, clampedTo - clampedFrom);
					const count = Math.max(1, textWords.length);
					const step = duration / count;

					const words = textWords.map((word, index) => {
						const wStart = Math.round(clampedFrom + index * step);
						const wEnd =
							index === count - 1
								? clampedTo
								: Math.round(clampedFrom + (index + 1) * step);
						return {
							word: word,
							start: wStart,
							end: wEnd,
						};
					});

					return {
						id: generateId(),
						name: "caption",
						type: "caption",
						display: {
							from: clampedFrom,
							to: clampedTo,
						},
						details: {
							text: cleanedText,
							words: words,
							width: 800,
							fontFamily: fontInfo.fontFamily,
							fontSize: fontInfo.fontSize,
							fontUrl: fontInfo.fontUrl,
							fill: "#FFFFFF",
							stroke: "#000000",
							strokeWidth: 0,
							textAlign: "center",
							letterSpacing: 0,
							lineHeight: 1.2,
							backgroundColor: "transparent",
							backgroundPadding: 0,
							borderRadius: 0,
						},
						metadata: {
							sourceUrl: selectedMedia,
							groupId: groupId,
							groupColor: groupColor,
							groupName: file.name.replace(/\.[^.]+$/, ""),
						},
					};
				})
				.filter((v): v is NonNullable<typeof v> => v !== null);

			// Create a single track with all items
			const trackId = generateId();
			const trackName = `SRT Captions (${file.name.replace(/\.[^.]+$/, "")})`;

			// Add all items and the track in a single dispatch
			dispatch(ADD_ITEMS, {
				payload: {
					trackItems: captionItems,
					tracks: [
						{
							id: trackId,
							items: captionItems.map((item) => item.id),
							type: "caption",
							name: trackName,
						},
					],
				},
			});

			toast.dismiss(loadingToast);
			toast.success(`Added ${captions.length} captions from SRT file`);

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			console.error("Error processing SRT file:", error);
			toast.dismiss(loadingToast);
			toast.error("Failed to process SRT file");
		} finally {
			setIsImporting(false);
		}
	};

	const parseSrtFile = (content: string) => {
		const captions: Array<{ startMs: number; endMs: number; text: string }> =
			[];
		const normalized = content
			.replace(/^\uFEFF/, "")
			.replace(/\r\n|\r/g, "\n")
			.trim();
		const blocks = normalized.split(/\n\n+/);

		for (const block of blocks) {
			const lines = block.split("\n").filter((l) => l.length > 0);
			if (lines.length < 2) continue;

			let timeIdx = 0;
			if (/^\d+$/.test(lines[0])) {
				timeIdx = 1;
			}

			const timeLine = lines[timeIdx];
			const timeMatch = timeLine.match(
				/(\d{2}:\d{2}:\d{2})[\.,](\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})[\.,](\d{3})/,
			);
			if (!timeMatch) continue;

			const startTime = `${timeMatch[1]}.${timeMatch[2]}`;
			const endTime = `${timeMatch[3]}.${timeMatch[4]}`;

			const startMs = srtTimeToMilliseconds(startTime);
			const endMs = srtTimeToMilliseconds(endTime);
			if (!(endMs > startMs)) continue;

			const textLines = lines.slice(timeIdx + 1);
			const text = textLines.join("\n");

			captions.push({ startMs, endMs, text });
		}

		return captions;
	};

	const srtTimeToMilliseconds = (timeString: string): number => {
		const [time, ms] = timeString.split(".") as [string, string];
		const [hours, minutes, seconds] = time.split(":").map((n) => Number(n));
		const milli = Number(ms.padEnd(3, "0").slice(0, 3));
		return (
			(hours || 0) * 3600000 +
			(minutes || 0) * 60000 +
			(seconds || 0) * 1000 +
			(milli || 0)
		);
	};

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				Subtitles (SRT)
			</div>

			<div className="flex h-[calc(100%-4.5rem)] flex-col gap-4 px-4">
				<Select value={selectedMedia} onValueChange={handleSelectChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select media" />
					</SelectTrigger>
					<SelectContent className="z-[200]">
						{selectMediaItems.map((item) => (
							<SelectItem value={item.value} key={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="px-0">
					<input
						ref={fileInputRef}
						type="file"
						accept=".srt"
						onChange={handleSrtUpload}
						className="hidden"
					/>
					<Button
						onClick={() => fileInputRef.current?.click()}
						variant="outline"
						className="w-full gap-2"
						size="sm"
						disabled={!selectedMedia || isImporting}
					>
						{isImporting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Importing...
							</>
						) : (
							<>
								<Upload className="h-4 w-4" />
								Upload SRT File
							</>
						)}
					</Button>
					{!selectedMedia && (
						<div className="mt-2 text-xs text-muted-foreground">
							Select a video or audio above to sync the SRT to the timeline.
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Helpers reused
const fetchMediaTrackItems = (trackItemsMap: ITrackItemsMap) => {
	return Object.values(trackItemsMap).filter(
		({ type }: ITrackItem) => type === "audio" || type === "video",
	);
};

const createSelectMediaOptions = (mediaTrackItems: ITrackItem[]) => {
	return mediaTrackItems.map(({ name, details }) => ({
		label: name,
		value: details.src,
	}));
};

// no group helpers needed here
