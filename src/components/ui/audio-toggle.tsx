"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/components/SoundProvider";
import { Button } from "@/components/ui/button";

export function AudioToggle() {
    const { isMuted, toggleMute } = useSound();

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
    );
}
