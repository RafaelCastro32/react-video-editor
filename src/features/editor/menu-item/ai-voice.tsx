import React, { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronDown, Pause, Play, Volume2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Voice, VoiceFilters } from "../interfaces/editor";
import useUploadStore from "../store/use-upload-store";

// Kokoro voices interface
interface KokoroVoice {
  id: string;
  name: string;
  lang: string;
  gender: string;
}

// Component to display generated audios
const GeneratedAudios = () => {
  const { uploads, setUploads } = useUploadStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  // Filter only Kokoro-generated audios
  const kokoroAudios = uploads.filter(
    (upload) => upload.type === 'audio' && upload.id?.startsWith('kokoro-audio-')
  );

  const handlePlayPause = (audioId: string, audioUrl: string) => {
    if (playingId === audioId) {
      // Pause current audio
      audioElements[audioId]?.pause();
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      if (playingId && audioElements[playingId]) {
        audioElements[playingId].pause();
        audioElements[playingId].currentTime = 0;
      }

      // Play new audio
      if (!audioElements[audioId]) {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setPlayingId(null));
        setAudioElements(prev => ({ ...prev, [audioId]: audio }));
        audio.play();
      } else {
        audioElements[audioId].play();
      }
      setPlayingId(audioId);
    }
  };

  const handleRemove = (audioId: string) => {
    // Stop audio if playing
    if (playingId === audioId) {
      audioElements[audioId]?.pause();
      setPlayingId(null);
    }

    // Remove from store
    setUploads(uploads.filter(upload => upload.id !== audioId));
    
    // Clean up audio element
    if (audioElements[audioId]) {
      audioElements[audioId].pause();
      audioElements[audioId].src = '';
      const newElements = { ...audioElements };
      delete newElements[audioId];
      setAudioElements(newElements);
    }

    toast.success('Audio removed');
  };

  if (kokoroAudios.length === 0) {
    return null;
  }

  return (
    <>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Generated Audios
          </span>
        </div>
      </div>

      {/* Audio List */}
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {kokoroAudios.map((audio) => (
            <div
              key={audio.id}
              className="group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
            >
              {/* Play/Pause Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handlePlayPause(audio.id, audio.url)}
              >
                {playingId === audio.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Audio Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audio.name}</p>
                <p className="text-xs text-muted-foreground">
                  {audio.duration ? `${(audio.duration / 1000).toFixed(1)}s` : 'Unknown duration'}
                </p>
              </div>

              {/* Remove Button (visible on hover) */}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(audio.id)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

export const AiVoice = () => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<KokoroVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<KokoroVoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<VoiceFilters>({
    language: "all",
    gender: "all"
  });
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Available filter options
  const filterOptions = {
    language: [
      "en",
      "hi",
      "es",
      "pl",
      "fr",
      "de",
      "tr",
      "hu",
      "it",
      "ru",
      "hr",
      "zh",
      "fil",
      "el",
      "fi",
      "ko",
      "no",
      "ta",
      "id",
      "ar",
      "ja",
      "ro",
      "pt",
      "cs",
      "vi",
      "sv",
      "nl",
      "da"
    ],
    gender: ["female", "male", "neutral"]
  };

  // Language display names
  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    es: "Spanish",
    pl: "Polish",
    fr: "French",
    de: "German",
    tr: "Turkish",
    hu: "Hungarian",
    it: "Italian",
    ru: "Russian",
    hr: "Croatian",
    zh: "Chinese",
    fil: "Filipino",
    el: "Greek",
    fi: "Finnish",
    ko: "Korean",
    no: "Norwegian",
    ta: "Tamil",
    id: "Indonesian",
    ar: "Arabic",
    ja: "Japanese",
    ro: "Romanian",
    pt: "Portuguese",
    cs: "Czech",
    vi: "Vietnamese",
    sv: "Swedish",
    nl: "Dutch",
    da: "Danish"
  };

  // Handle play/pause for a specific voice (Kokoro doesn't have previews)
  const handlePlayPause = (voiceId: string) => {
    // Kokoro voices don't have preview URLs
    // You could generate a sample sentence here if needed
    toast.info("Preview not available for Kokoro voices. Generate audio to hear the voice.");
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  // Fetch Kokoro voices from local API
  const fetchVoices = async (queryParams?: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/kokoro");

      if (response.ok) {
        const data = await response.json();
        let filteredVoices = data.voices || [];
        
        // Apply filters
        if (queryParams?.language && queryParams.language !== "all") {
          filteredVoices = filteredVoices.filter((v: KokoroVoice) => 
            v.lang.toLowerCase().includes(queryParams.language.toLowerCase())
          );
        }
        if (queryParams?.gender && queryParams.gender !== "all") {
          filteredVoices = filteredVoices.filter((v: KokoroVoice) => 
            v.gender === queryParams.gender
          );
        }
        
        setVoices(filteredVoices);
        
        // Set default voice (Portuguese female)
        if (filteredVoices.length > 0 && !selectedVoice) {
          const defaultVoice = filteredVoices.find((v: KokoroVoice) => v.id === "pf_dora") || filteredVoices[0];
          setSelectedVoice(defaultVoice);
        }
      } else {
        console.error("Failed to fetch Kokoro voices");
        toast.error("Failed to load Kokoro voices. Make sure Python environment is set up.");
      }
    } catch (error) {
      console.error("Error fetching Kokoro voices:", error);
      toast.error("Error loading voices. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Load voices on component mount
  useEffect(() => {
    fetchVoices();
  }, []);

  // Apply filters automatically when filters change
  const applyFilters = (newFilters: VoiceFilters) => {
    const queryParams: any = {};
    if (newFilters.language && newFilters.language !== "all")
      queryParams.languages = [newFilters.language];
    if (newFilters.gender && newFilters.gender !== "all")
      queryParams.genders = [newFilters.gender];
    fetchVoices(queryParams);
  };

  const handleGenerate = async () => {
    if (!text.trim() || !selectedVoice) return;

    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      // Call Kokoro local TTS API
      const response = await fetch("/api/kokoro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audio) {
        setGeneratedAudio(data.audio);
        
        // Convert base64 to blob and add to editor
        try {
          // Extract base64 data
          const base64Data = data.audio.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' });
          
          // Create object URL
          const audioUrl = URL.createObjectURL(blob);
          
          // Create audio element to get duration
          const audioElement = new Audio(audioUrl);
          
          audioElement.addEventListener('loadedmetadata', () => {
            const durationMs = Math.floor(audioElement.duration * 1000);
            
            // Create unique ID for the audio
            const audioId = `kokoro-audio-${Date.now()}`;
            
            // Add to upload store using setUploads
            const { setUploads } = useUploadStore.getState();
            setUploads((prev) => [
              ...prev,
              {
                id: audioId,
                name: `Kokoro Voice - ${selectedVoice.name}.wav`,
                url: audioUrl,
                filePath: audioUrl,
                type: 'audio',
                duration: durationMs,
                width: 0,
                height: 0,
              }
            ]);
            
            toast.success("Voice generated and added to uploads!");
            
            // Play the audio
            audioElement.play();
          });
          
          audioElement.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            toast.error('Generated audio but failed to load metadata');
            
            // Still play it even if metadata fails
            const audio = new Audio(data.audio);
            audio.play();
          });
          
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.warning('Voice generated but failed to add to editor');
          
          // Fallback: just play the audio
          const audio = new Audio(data.audio);
          audio.play();
        }
      } else {
        toast.error("Voice generation completed but no audio received");
      }
    } catch (error) {
      console.error("Error generating voice with Kokoro:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate voice. Make sure Kokoro Python environment is running."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col max-w-full">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        AI Voice Generation
      </div>

      <div className="space-y-4 p-4">
        {/* Text Input */}
        <div className="space-y-2">
          <Label className="font-sans text-xs font-semibold">
            Enter your script
          </Label>

          <Textarea
            id="text-input"
            placeholder="Type or paste your text here to generate AI voice..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
            className="min-h-[120px] resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Voice Selection */}
        <div className="space-y-3">
          <div className="flex gap-2 min-w-0 flex-col">
            <Label className="font-sans text-xs font-semibold">
              Select voice
            </Label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                {selectedVoice ? (
                  (() => {
                    const displayName = selectedVoice.name.split("-")[0].trim();
                    return (
                      <div
                        aria-label="Change selected voice"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              ".voice-preview-btn"
                            )
                          )
                            return;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            if (
                              (e.target as HTMLElement).closest(
                                ".voice-preview-btn"
                              )
                            )
                              return;
                            e.preventDefault();
                            e.currentTarget.click();
                          }
                        }}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "flex-1 min-w-0 h-7 justify-between text-xs w-full relative"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 flex-shrink-0 p-0 hover:bg-transparent voice-preview-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPause(selectedVoice.id);
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <span className="truncate">{displayName}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </div>
                    );
                  })()
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 h-7 justify-between text-xs w-full"
                    type="button"
                  >
                    <span className="truncate">Select voice</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                )}
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-[420px] max-h-[500px] overflow-hidden bg-zinc-900 text-white p-0"
                align="start"
              >
                <div className="space-y-4">
                  {/* Filters Row */}
                  <div className="flex gap-2 mb-2 p-2">
                    <Select
                      value={filters.language}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, language: value };
                        setFilters(newFilters);
                        applyFilters(newFilters);
                      }}
                    >
                      <SelectTrigger
                        id="language-select"
                        className="w-1/2 bg-zinc-800 border-zinc-700"
                      >
                        <span className="flex items-center gap-2">
                          <span className="fi fi-{filters.language}" />
                          <SelectValue placeholder="Language" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        {filterOptions.language.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {languageNames[lang] || lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.gender}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, gender: value };
                        setFilters(newFilters);
                        applyFilters(newFilters);
                      }}
                    >
                      <SelectTrigger
                        id="gender-select"
                        className="w-1/2 bg-zinc-800 border-zinc-700"
                      >
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Gender</SelectItem>
                        {filterOptions.gender.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Voice List */}
                  <ScrollArea className="h-[400px] pr-2 text-sm">
                    <div className="flex flex-col gap-1">
                      {voices.map((voice) => {
                        const isRowSelected = selectedVoice?.id === voice.id;
                        return (
                          <div
                            key={voice.id}
                            className={`flex items-center px-2 rounded-lg  py-2 cursor-pointer transition-colors ${isRowSelected ? "bg-blue-600 text-white" : "hover:bg-zinc-800/80 text-white/90"}`}
                            onClick={() => {
                              setSelectedVoice(voice);
                              setIsPopoverOpen(false);
                            }}
                          >
                            {/* Voice Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {/* Voice icon (no preview for Kokoro) */}
                                <div className="flex-shrink-0 h-10 w-10 bg-zinc-700/60 rounded flex items-center justify-center">
                                  <span className="text-sm font-semibold">
                                    {voice.gender === 'female' ? '♀' : '♂'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const parts = voice.name.split(" - ");
                                    const name = parts[0];
                                    const description = parts[1];

                                    return (
                                      <div className="truncate">
                                        <span>{name}</span>
                                        {description && (
                                          <span className="text-muted-foreground">
                                            {" "}
                                            - {description}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-zinc-700/60 border-none text-white/90 rounded-sm"
                                >
                                  {voice.gender.charAt(0).toUpperCase() +
                                    voice.gender.slice(1)}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-zinc-700/60 border-none text-white/90 rounded-sm"
                                >
                                  {voice.lang}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-600/60 border-none text-white/90 rounded-sm"
                                >
                                  Kokoro TTS
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {voices.length === 0 && !loading && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No voices found. Try adjusting your filters.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            onClick={handleGenerate}
            disabled={!text.trim() || !selectedVoice || isGenerating}
            className="flex items-center gap-2 w-full"
            size={"sm"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Voice"
            )}
          </Button>
        </div>

        {/* Generated Audios Section */}
        <GeneratedAudios />
      </div>
    </div>
  );
};
