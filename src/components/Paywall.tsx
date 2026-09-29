import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { startTripPassCheckout, type TripPassTier } from "@/api/tripPass";
import { toast } from "@/hooks/use-toast";

interface PaywallProps {
  usageCount: number;
  limit: number;
}

export function Paywall({ usageCount, limit }: PaywallProps) {
  const { user } = useAuth();
  const [loadingTier, setLoadingTier] = useState<TripPassTier | null>(null);

  const handleCheckout = async (tier: TripPassTier) => {
    setLoadingTier(tier);
    try {
      const url = await startTripPassCheckout(tier, user?.id ?? null);
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Couldn't start checkout",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setLoadingTier(null);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8 border-2 border-primary/20">
      <CardHeader className="text-center">
        <Lock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
        <CardTitle>You've used your free analyses</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          You've used all <strong>{limit}</strong> of your free menu analyses.
          Grab a trip pass for unlimited scanning while you travel.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border p-4 text-left disabled:opacity-50"
            onClick={() => handleCheckout("7day")}
            disabled={loadingTier !== null}
          >
            <p className="text-2xl font-bold text-foreground">£3.99</p>
            <p className="text-sm text-muted-foreground">7 days unlimited</p>
          </button>
          <button
            type="button"
            className="rounded-lg border-2 border-primary/40 p-4 text-left disabled:opacity-50"
            onClick={() => handleCheckout("30day")}
            disabled={loadingTier !== null}
          >
            <p className="text-2xl font-bold text-foreground">£6.99</p>
            <p className="text-sm text-muted-foreground">30 days unlimited</p>
          </button>
        </div>

        {loadingTier && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to checkout…
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          No subscription. Pay once, scan freely for the trip.
        </p>
      </CardContent>
    </Card>
  );
}
