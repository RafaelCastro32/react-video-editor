import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

type UseCopyToClipboardProps = {
  text: string;
  copyMessage?: string;
};

export function useCopyToClipboard({
  text,
  copyMessage = "Copied to clipboard!"
}: UseCopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(() => {
    // Check if clipboard API is supported
    if (!navigator.clipboard) {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success(copyMessage);
          setIsCopied(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          timeoutRef.current = setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        } else {
          toast.error("Copy to clipboard is not supported in this browser");
        }
      } catch (err) {
        toast.error("Failed to copy to clipboard.");
      }
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(copyMessage);
        setIsCopied(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard.");
      });
  }, [text, copyMessage]);

  return { isCopied, handleCopy };
}
