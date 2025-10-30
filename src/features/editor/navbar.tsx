import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { HISTORY_UNDO, HISTORY_REDO, DESIGN_RESIZE } from "@designcombo/state";
import { Icons } from "@/components/shared/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  ChevronDown,
  Download,
  ProportionsIcon,
  ShareIcon,
  Settings
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useStore from "./store/use-store";
import { toast } from "sonner";

import type StateManager from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import type { IDesign } from "@designcombo/types";
import { useDownloadState } from "./store/use-download-state";
import DownloadProgressModal from "./download-progress-modal";
import AutosizeInput from "@/components/ui/autosize-input";
import { debounce } from "lodash";
import {
  useIsLargeScreen,
  useIsMediumScreen,
  useIsSmallScreen
} from "@/hooks/use-media-query";

import { LogoIcons } from "@/components/shared/logos";
import Link from "next/link";

export default function Navbar({
  user,
  stateManager,
  setProjectName,
  projectName
}: {
  user: any | null;
  stateManager: StateManager;
  setProjectName: (name: string) => void;
  projectName: string;
}) {
  const [title, setTitle] = useState(projectName);
  const isLargeScreen = useIsLargeScreen();
  const isMediumScreen = useIsMediumScreen();
  const isSmallScreen = useIsSmallScreen();

  const handleUndo = () => {
    dispatch(HISTORY_UNDO);
  };

  const handleRedo = () => {
    dispatch(HISTORY_REDO);
  };

  const handleCreateProject = async () => {};

  // Create a debounced function for setting the project name
  const debouncedSetProjectName = useCallback(
    debounce((name: string) => {
      console.log("Debounced setProjectName:", name);
      setProjectName(name);
    }, 2000), // 2 seconds delay
    []
  );

  // Update the debounced function whenever the title changes
  useEffect(() => {
    debouncedSetProjectName(title);
  }, [title, debouncedSetProjectName]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isLargeScreen ? "320px 1fr 320px" : "1fr 1fr 1fr"
      }}
      className="bg-muted pointer-events-none flex h-11 items-center border-b border-border/80 px-2"
    >
      <DownloadProgressModal />

      <div className="flex items-center gap-2">
        <div className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-md text-zinc-200">
          <LogoIcons.scenify />
        </div>

        <div className=" pointer-events-auto flex h-10 items-center px-1.5">
          <Button
            onClick={handleUndo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.undo width={20} />
          </Button>
          <Button
            onClick={handleRedo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.redo width={20} />
          </Button>
        </div>
      </div>

      <div className="flex h-11 items-center justify-center gap-2">
        {!isSmallScreen && (
          <div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5 text-muted-foreground">
            <AutosizeInput
              name="title"
              value={title}
              onChange={handleTitleChange}
              width={200}
              inputClassName="border-none outline-none px-1 bg-background text-sm font-medium text-zinc-200"
            />
          </div>
        )}
      </div>

      <div className="flex h-11 items-center justify-end gap-2">
        <div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5">
          <Link href="https://discord.gg/Jmxsd5f2jp" target="_blank">
            <Button className="h-7 rounded-lg" variant={"outline"}>
              <LogoIcons.discord className="w-6 h-6" />
              <span className="hidden md:block">Join Us</span>
            </Button>
          </Link>
          <Button
            className="flex h-7 gap-1 border border-border"
            variant="outline"
            size={isMediumScreen ? "sm" : "icon"}
          >
            <ShareIcon width={18} />{" "}
            <span className="hidden md:block">Share</span>
          </Button>

          <VideoSizePopover />
          <DownloadPopover stateManager={stateManager} />
        </div>
      </div>
    </div>
  );
}

const VideoSizePopover = () => {
  const isMediumScreen = useIsMediumScreen();
  const { size, setSize } = useStore();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(size.width.toString());
  const [height, setHeight] = useState(size.height.toString());

  // Preset sizes
  const presets = [
    { name: "Portrait (9:16)", width: 1080, height: 1920 },
    { name: "Landscape (16:9)", width: 1920, height: 1080 },
    { name: "Square (1:1)", width: 1080, height: 1080 },
    { name: "Portrait (4:5)", width: 1080, height: 1350 },
    { name: "Landscape (4:3)", width: 1280, height: 960 },
    { name: "Ultrawide (21:9)", width: 2560, height: 1080 },
    { name: "Full HD (16:9)", width: 1920, height: 1080 },
    { name: "4K (16:9)", width: 3840, height: 2160 }
  ];

  const handleApply = () => {
    const w = parseInt(width);
    const h = parseInt(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      toast.error("Please enter valid dimensions");
      return;
    }

    if (w > 4096 || h > 4096) {
      toast.error("Maximum dimension is 4096px");
      return;
    }

    setSize({ width: w, height: h });
    toast.success(`Video size changed to ${w}x${h}`);
    setOpen(false);
  };

  const handlePreset = (preset: { width: number; height: number }) => {
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
    setSize({ width: preset.width, height: preset.height });
    toast.success(`Video size changed to ${preset.width}x${preset.height}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex h-7 gap-1 border border-border"
          variant="outline"
          size={isMediumScreen ? "sm" : "icon"}
        >
          <Settings width={18} />
          <span className="hidden md:block">Size</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="bg-sidebar z-[250] flex w-80 flex-col gap-4"
      >
        <div>
          <Label className="text-sm font-medium">Video Dimensions</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Current: {size.width} × {size.height}
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Presets</Label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => handlePreset(preset)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-muted-foreground">
                    {preset.width}×{preset.height}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Size */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Custom Size</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Width (px)</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="1080"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Height (px)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="1920"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button onClick={handleApply} size="sm" className="w-full">
            Apply Custom Size
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DownloadPopover = ({ stateManager }: { stateManager: StateManager }) => {
  const isMediumScreen = useIsMediumScreen();
  const { actions, exportType, exportMode } = useDownloadState();
  const [isExportTypeOpen, setIsExportTypeOpen] = useState(false);
  const [isExportModeOpen, setIsExportModeOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const data: IDesign = {
      id: generateId(),
      ...stateManager.toJSON()
    };

    console.log({ data });

    actions.setState({ payload: data });

    // Use local or cloud export based on mode
    if (exportMode === "local") {
      actions.startLocalExport();
    } else {
      actions.startExport();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex h-7 gap-1 border border-border"
          size={isMediumScreen ? "sm" : "icon"}
        >
          <Download width={18} />{" "}
          <span className="hidden md:block">Export</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="bg-sidebar z-[250] flex w-60 flex-col gap-4"
      >
        <Label>Export settings</Label>

        {/* Export Mode Selector */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Export Mode</Label>
          <Popover open={isExportModeOpen} onOpenChange={setIsExportModeOpen}>
            <PopoverTrigger asChild>
              <Button className="w-full justify-between" variant="outline">
                <div>{exportMode === "local" ? "Local (Offline)" : "Cloud"}</div>
                <ChevronDown width={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-background z-[251] w-[--radix-popover-trigger-width] px-2 py-2">
              <div
                className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
                onClick={() => {
                  actions.setExportMode("local");
                  setIsExportModeOpen(false);
                }}
              >
                Local (Offline)
              </div>
              <div
                className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
                onClick={() => {
                  actions.setExportMode("cloud");
                  setIsExportModeOpen(false);
                }}
              >
                Cloud (Requires Internet)
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Export Type Selector */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Format</Label>
          <Popover open={isExportTypeOpen} onOpenChange={setIsExportTypeOpen}>
            <PopoverTrigger asChild>
              <Button className="w-full justify-between" variant="outline">
                <div>{exportType.toUpperCase()}</div>
                <ChevronDown width={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-background z-[251] w-[--radix-popover-trigger-width] px-2 py-2">
              <div
                className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
                onClick={() => {
                  actions.setExportType("mp4");
                  setIsExportTypeOpen(false);
                }}
              >
                MP4
              </div>
              <div
                className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
                onClick={() => {
                  actions.setExportType("json");
                  setIsExportTypeOpen(false);
                }}
              >
                JSON
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Button onClick={handleExport} className="w-full">
            Export {exportMode === "local" ? "(Local)" : "(Cloud)"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ResizeOptionProps {
  label: string;
  icon: string;
  value: ResizeValue;
  description: string;
}

interface ResizeValue {
  width: number;
  height: number;
  name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
  {
    label: "16:9",
    icon: "landscape",
    description: "YouTube ads",
    value: {
      width: 1920,
      height: 1080,
      name: "16:9"
    }
  },
  {
    label: "9:16",
    icon: "portrait",
    description: "TikTok, YouTube Shorts",
    value: {
      width: 1080,
      height: 1920,
      name: "9:16"
    }
  },
  {
    label: "1:1",
    icon: "square",
    description: "Instagram, Facebook posts",
    value: {
      width: 1080,
      height: 1080,
      name: "1:1"
    }
  }
];

const ResizeVideo = () => {
  const handleResize = (options: ResizeValue) => {
    dispatch(DESIGN_RESIZE, {
      payload: {
        ...options
      }
    });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="z-10 h-7 gap-2" variant="outline" size={"sm"}>
          <ProportionsIcon className="h-4 w-4" />
          <div>Resize</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[250] w-60 px-2.5 py-3">
        <div className="text-sm">
          {RESIZE_OPTIONS.map((option, index) => (
            <ResizeOption
              key={index}
              label={option.label}
              icon={option.icon}
              value={option.value}
              handleResize={handleResize}
              description={option.description}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ResizeOption = ({
  label,
  icon,
  value,
  description,
  handleResize
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
  const Icon = Icons[icon as "text"];
  return (
    <div
      onClick={() => handleResize(value)}
      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
    >
      <div className="w-8 text-muted-foreground">
        <Icon size={20} />
      </div>
      <div>
        <div>{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
};
