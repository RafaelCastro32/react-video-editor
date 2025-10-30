import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { generateCaptions } from "../utils/captions";
import { loadFonts } from "../utils/fonts";
import { dispatch } from "@designcombo/events";
import { ADD_CAPTIONS, ADD_ITEMS } from "@designcombo/state";
import { ITrackItem, ITrackItemsMap } from "@designcombo/types";
import { millisecondsToHHMMSS } from "../utils/format";
import useStore from "../store/use-store";
import { groupBy } from "lodash";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PLAYER_SEEK } from "../constants/events";
import { useCurrentPlayerFrame } from "../hooks/use-current-frame";
import { generateId } from "@designcombo/timeline";
import { Loader2, Plus, Save, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Captions = () => {
  const { trackItemsMap, playerRef } = useStore();
  const [selectMediaItems, setSelectMediaItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedMedia, setSelectedMedia] = useState<string | undefined>();
  const [captionTrackItemsMap, setCaptionTrackItemsMap] = useState<
    Record<string, ITrackItem[]>
  >({});
  const [mediaTrackItems, setMediaTrackItems] = useState<ITrackItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualCaption, setManualCaption] = useState({
    text: "",
    startTime: "00:00:00",
    endTime: "00:00:02"
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mediaTrackItems = fetchMediaTrackItems(trackItemsMap);
    setMediaTrackItems(mediaTrackItems);

    const selectMediaOptions = createSelectMediaOptions(mediaTrackItems);
    setSelectMediaItems(selectMediaOptions);

    const groupedCaptions = groupCaptionItems(trackItemsMap);

    for (const key of Object.keys(groupedCaptions)) {
      const captions = groupedCaptions[key];
      const orderedCaptionByDisplayFrom = captions.sort(
        (a, b) => a.display.from - b.display.from
      );
      console.log({ orderedCaptionByDisplayFrom });
      groupedCaptions[key] = orderedCaptionByDisplayFrom as ITrackItem[];
    }
    setCaptionTrackItemsMap(groupedCaptions);
  }, [trackItemsMap]);

  const handleSelectChange = (value: string) => {
    setSelectedMedia(value);
  };

  const handleSrtUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.srt')) {
      toast.error('Please upload a valid SRT file');
      return;
    }

    try {
      const text = await file.text();
      const captions = parseSrtFile(text);
      
      if (captions.length === 0) {
        toast.error('No captions found in SRT file');
        return;
      }

      const fontInfo = {
        fontFamily: "theboldfont",
        fontUrl: "https://cdn.designcombo.dev/fonts/the-bold-font.ttf",
        fontSize: 64
      };

      await loadFonts([{ name: fontInfo.fontFamily, url: fontInfo.fontUrl }]);

      const captionItems = captions.map((caption) => ({
        id: generateId(),
        name: "caption",
        type: "caption",
        display: {
          from: caption.startMs,
          to: caption.endMs
        },
        details: {
          text: caption.text,
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
          borderRadius: 0
        },
        metadata: {}
      }));

      dispatch(ADD_ITEMS, {
        payload: {
          trackItems: captionItems,
          tracks: [
            {
              id: generateId(),
              items: captionItems.map((item) => item.id),
              type: "caption",
              name: "SRT Captions"
            }
          ]
        }
      });

      toast.success(`Added ${captions.length} captions from SRT file`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing SRT file:', error);
      toast.error('Failed to process SRT file');
    }
  };

  const parseSrtFile = (content: string) => {
    const captions: Array<{ startMs: number; endMs: number; text: string }> = [];
    const blocks = content.trim().split('\n\n');

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      // Parse timecode line (e.g., "00:00:01,000 --> 00:00:03,000")
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (!timeMatch) continue;

      const startTime = timeMatch[1].replace(',', '.');
      const endTime = timeMatch[2].replace(',', '.');
      
      // Convert to milliseconds
      const startMs = srtTimeToMilliseconds(startTime);
      const endMs = srtTimeToMilliseconds(endTime);

      // Get caption text (all lines after timecode)
      const text = lines.slice(2).join('\n');

      captions.push({ startMs, endMs, text });
    }

    return captions;
  };

  const srtTimeToMilliseconds = (timeString: string): number => {
    const [time, ms] = timeString.split('.');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + Number(ms);
  };

  const addManualCaption = async () => {
    try {
      const startMs = parseTimeToMilliseconds(manualCaption.startTime);
      const endMs = parseTimeToMilliseconds(manualCaption.endTime);

      if (endMs <= startMs) {
        toast.error("End time must be greater than start time");
        return;
      }

      if (!manualCaption.text.trim()) {
        toast.error("Caption text cannot be empty");
        return;
      }

      const fontInfo = {
        fontFamily: "theboldfont",
        fontUrl: "https://cdn.designcombo.dev/fonts/the-bold-font.ttf",
        fontSize: 64
      };

      await loadFonts([{ name: fontInfo.fontFamily, url: fontInfo.fontUrl }]);

      const captionItem = {
        id: generateId(),
        name: "caption",
        type: "caption",
        display: {
          from: startMs,
          to: endMs
        },
        details: {
          appearedColor: "#FFFFFF",
          activeColor: "#50FF12",
          activeFillColor: "#7E12FF",
          color: "#DADADA",
          backgroundColor: "transparent",
          borderColor: "#000000",
          borderWidth: 5,
          text: manualCaption.text,
          fontSize: fontInfo.fontSize,
          width: 800,
          fontFamily: fontInfo.fontFamily,
          fontUrl: fontInfo.fontUrl,
          textAlign: "center",
          linesPerCaption: 1,
          words: [{
            word: manualCaption.text,
            start: startMs,
            end: endMs,
            confidence: 1,
            is_keyword: false
          }],
          fontWeight: 400,
          fontStyle: "normal",
          textDecoration: "none",
          lineHeight: "normal",
          letterSpacing: "normal",
          wordSpacing: "normal",
          border: "none",
          textShadow: "none",
          opacity: 100,
          wordWrap: "normal",
          wordBreak: "normal",
          WebkitTextStrokeColor: "#ffffff",
          WebkitTextStrokeWidth: "0px",
          top: "920px",
          left: "140px",
          textTransform: "none",
          transform: "none",
          skewX: 0,
          skewY: 0,
          height: 80,
          boxShadow: {
            color: "#000000",
            x: 0,
            y: 0,
            blur: 0
          }
        },
        metadata: {
          sourceUrl: selectedMedia || "manual",
          manual: true
        }
      };

      dispatch(ADD_ITEMS, {
        payload: {
          trackItems: [captionItem],
          tracks: [
            {
              id: generateId(),
              items: [captionItem.id],
              type: "caption",
              name: "Captions"
            }
          ]
        }
      });

      // Reset form
      setManualCaption({
        text: "",
        startTime: "00:00:00",
        endTime: "00:00:02"
      });
      setIsAddingManual(false);
      toast.success("Caption added successfully!");
    } catch (error) {
      console.error("Error adding manual caption:", error);
      toast.error("Failed to add caption");
    }
  };

  const createCaptions = async (selectedMedia: string) => {
    setIsGenerating(true);
    try {
      const trackItem = mediaTrackItems.find(
        (m) => m.details.src === selectedMedia
      );

      if (!trackItem) {
        throw new Error("Track item not found");
      }

      const { url } = await transcribeMedia(selectedMedia, "ES");
      const jsonData = await fetchJsonFromUrl(url);
      const fontInfo = {
        fontFamily: "theboldfont",
        fontUrl: "https://cdn.designcombo.dev/fonts/the-bold-font.ttf",
        fontSize: 64
      };
      const options = {
        containerWidth: 800,
        linesPerCaption: 1,
        parentId: trackItem.id,
        displayFrom: trackItem.display.from
      };

      await loadFonts([{ name: fontInfo.fontFamily, url: fontInfo.fontUrl }]);
      const captions = generateCaptions(
        { ...jsonData, sourceUrl: selectedMedia },
        fontInfo,
        options
      );

      console.log({ captions });

      dispatch(ADD_ITEMS, {
        payload: {
          trackItems: captions,
          tracks: [
            {
              id: generateId(),
              items: captions.map((item) => item.id),
              type: "caption",
              name: "Captions"
            }
          ]
        }
      });
    } catch (error) {
      console.error("Error generating captions:", error);
      toast.error("Failed to generate captions. Check if API is configured.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Header />
      
      {/* SRT Upload */}
      <div className="px-4">
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
        >
          <Upload className="h-4 w-4" />
          Upload SRT File
        </Button>
      </div>

      {/* Manual Caption Form */}
      <div className="px-4">
        {!isAddingManual ? (
          <Button
            onClick={() => setIsAddingManual(true)}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Manual Caption
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Manual Caption</h3>
              <Button
                onClick={() => setIsAddingManual(false)}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Caption Text</label>
              <Textarea
                placeholder="Enter caption text..."
                value={manualCaption.text}
                onChange={(e) =>
                  setManualCaption({ ...manualCaption, text: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Time (HH:MM:SS)</label>
                <Input
                  placeholder="00:00:00"
                  value={manualCaption.startTime}
                  onChange={(e) =>
                    setManualCaption({ ...manualCaption, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Time (HH:MM:SS)</label>
                <Input
                  placeholder="00:00:02"
                  value={manualCaption.endTime}
                  onChange={(e) =>
                    setManualCaption({ ...manualCaption, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              onClick={addManualCaption}
              className="w-full gap-2"
              size="sm"
            >
              <Save className="h-4 w-4" />
              Add Caption
            </Button>
          </div>
        )}
      </div>

      {/* Existing caption functionality */}
      {mediaTrackItems.length === 0 ? (
        <EmptyMediaTrackItems />
      ) : (
        <MediaSection
          selectMediaItems={selectMediaItems}
          selectedMedia={selectedMedia}
          onSelectChange={handleSelectChange}
          captionTrackItemsMap={captionTrackItemsMap}
          createCaptions={createCaptions}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};

const Header = () => (
  <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
    Captions
  </div>
);

const MediaSection = ({
  selectMediaItems,
  selectedMedia,
  onSelectChange,
  captionTrackItemsMap,
  createCaptions,
  isGenerating
}: {
  selectMediaItems: { label: string; value: string }[];
  selectedMedia: string | undefined;
  onSelectChange: (value: string) => void;
  captionTrackItemsMap: Record<string, ITrackItem[]>;
  createCaptions: (selectedMedia: string) => void;
  isGenerating: boolean;
}) => (
  <div className="flex h-[calc(100%-4.5rem)] flex-col gap-4 px-4">
    <Select value={selectedMedia} onValueChange={onSelectChange}>
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

    {selectedMedia ? (
      captionTrackItemsMap[selectedMedia] ? (
        <div className="h-[calc(100vh-29rem)]">
          <ScrollArea className="h-full">
            <MediaWithCaptions
              captionTrackItems={captionTrackItemsMap[selectedMedia]}
            />
          </ScrollArea>
        </div>
      ) : (
        <MediaWithNoCaptions
          createCaptions={() => createCaptions(selectedMedia)}
          isGenerating={isGenerating}
        />
      )
    ) : (
      <MediaNoSelected />
    )}
  </div>
);

const MediaNoSelected = () => (
  <div className="text-center text-sm text-muted-foreground">
    Select video or audio and generate captions automatically.
  </div>
);

const EmptyMediaTrackItems = () => (
  <div className="text-center text-sm text-muted-foreground">
    Add video or audio and generate captions automatically.
  </div>
);

const MediaWithNoCaptions = ({
  createCaptions,
  isGenerating
}: {
  createCaptions: () => void;
  isGenerating: boolean;
}) => (
  <div className="flex flex-col gap-2 px-4">
    <div className="text-center text-sm text-muted-foreground">
      Recognize speech in the selected video/audio and generate captions
      automatically.
    </div>
    <Button
      onClick={createCaptions}
      variant="default"
      className="w-full"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate"
      )}
    </Button>
  </div>
);

const MediaWithCaptions = ({
  captionTrackItems
}: {
  captionTrackItems: ITrackItem[];
}) => {
  const { playerRef } = useStore();
  const currentFrame = useCurrentPlayerFrame(playerRef || null);

  return (
    <div className="flex flex-col gap-2">
      {captionTrackItems.map((item) => (
        <CaptionItem
          isActive={
            currentFrame * (1000 / 30) >= item.display.from &&
            currentFrame * (1000 / 30) <= item.display.to
          }
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
};
const CaptionItem = ({
  item,
  isActive
}: {
  item: ITrackItem;
  isActive?: boolean;
}) => {
  const { display, details } = item;
  // const [timeline, setTimeline] = useState(0);
  // const { fps, playerRef } = useStore();
  // const currentFrame = useCurrentPlayerFrame(playerRef!);
  // const [inRange, setInRange] = useState(false);
  // useEffect(() => {
  //   setTimeline(currentFrame / fps);
  // }, [currentFrame, fps]);

  // const isInRange = useCallback(() => {
  //   return timeline >= display.from / 1000 && timeline <= display.to / 1000;
  // }, [timeline, display.from, display.to]);

  // useEffect(() => {
  //   setInRange(isInRange());
  // }, [timeline, isInRange]);

  const handleSeek = (time: number) => {
    dispatch(PLAYER_SEEK, { payload: { time: time } });
  };
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg p-2 hover:cursor-pointer hover:bg-slate-900 ${
        isActive
          ? "bg-captions-background text-captions-text"
          : "text-muted-foreground"
      }`}
      onClick={() => handleSeek(display.from)}
    >
      <div className="flex flex-col gap-1">
        <div className="text-xs">
          {millisecondsToHHMMSS(display.from)} -{" "}
          {millisecondsToHHMMSS(display.to)}
        </div>
        <div className="text-sm">{details.text}</div>
      </div>
    </div>
  );
};
// Helper functions
const fetchMediaTrackItems = (trackItemsMap: ITrackItemsMap) => {
  return Object.values(trackItemsMap).filter(
    ({ type }: ITrackItem) => type === "audio" || type === "video"
  );
};

const createSelectMediaOptions = (mediaTrackItems: ITrackItem[]) => {
  return mediaTrackItems.map(({ name, details }) => ({
    label: name,
    value: details.src
  }));
};

const groupCaptionItems = (trackItemsMap: ITrackItemsMap) => {
  const captionTrackItems = Object.values(trackItemsMap).filter(
    ({ type }: ITrackItem) => type === "caption"
  );
  return groupBy(captionTrackItems, "metadata.sourceUrl");
};

async function transcribeMedia(
  mediaUrl: string,
  targetLanguage: string
): Promise<{ url: string }> {
  const transcribeResponse = await fetch("/api/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: mediaUrl,
      targetLanguage
    })
  });

  if (!transcribeResponse.ok) {
    throw new Error("Failed to initiate transcription.");
  }

  const transcribeData = await transcribeResponse.json();
  const { transcribe } = transcribeData;

  return { url: transcribe.url };
}

async function fetchJsonFromUrl(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching JSON: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch JSON data:", error);
    throw error; // Optionally rethrow to handle it in the caller
  }
}

function parseTimeToMilliseconds(timeString: string): number {
  try {
    const parts = timeString.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid time format");
    }
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error("Invalid time values");
    }
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  } catch (error) {
    console.error("Error parsing time:", error);
    return 0;
  }
}
