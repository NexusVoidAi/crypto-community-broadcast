
import { Sparkles } from "lucide-react";

export function ComingSoonOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-crypto-darkgray/90 flex flex-col items-center justify-center z-10 rounded-lg border border-border/20">
      <Sparkles className="h-8 w-8 text-crypto-green mb-4" />
      <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
      <p className="text-muted-foreground">This feature is under development</p>
    </div>
  );
}
