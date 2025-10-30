import { Button, buttonVariants } from "@/components/ui/button";
import { ADD_AUDIO, ADD_IMAGE, ADD_TEXT } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import Draggable from "@/components/shared/draggable";
import { TEXT_ADD_PAYLOAD } from "../constants/payload";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Texts = () => {
  const isDraggingOverTimeline = useIsDraggingOverTimeline();
  const [customText, setCustomText] = useState("");

  const handleAddText = () => {
    dispatch(ADD_TEXT, {
      payload: { ...TEXT_ADD_PAYLOAD, id: nanoid() },
      options: {}
    });
  };

  const handleAddCustomText = () => {
    if (!customText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    const customPayload = {
      ...TEXT_ADD_PAYLOAD,
      id: nanoid(),
      details: {
        ...TEXT_ADD_PAYLOAD.details,
        text: customText.trim()
      }
    };

    dispatch(ADD_TEXT, {
      payload: customPayload,
      options: {}
    });

    toast.success("Custom text added to timeline");
    setCustomText("");
  };
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Text
      </div>
      
      <div className="flex flex-col gap-4 px-4">
        {/* Quick Add Default Text */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Add</Label>
          <Draggable
            data={TEXT_ADD_PAYLOAD}
            renderCustomPreview={
              <Button variant="secondary" className="w-60">
                Add text
              </Button>
            }
            shouldDisplayPreview={!isDraggingOverTimeline}
          >
            <div
              onClick={handleAddText}
              className={cn(
                buttonVariants({ variant: "default" }),
                "cursor-pointer w-full"
              )}
            >
              Add default text
            </div>
          </Draggable>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* Custom Text Input */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Custom Text</Label>
          <Textarea
            placeholder="Type your custom text here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button
            onClick={handleAddCustomText}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add custom text to timeline
          </Button>
        </div>
      </div>
    </div>
  );
};
