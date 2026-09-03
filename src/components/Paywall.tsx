import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PaywallProps {
  usageCount: number;
  limit: number;
}

export function Paywall({ usageCount, limit }: PaywallProps) {
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
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold text-foreground">£3.99</p>
            <p className="text-sm text-muted-foreground">7 days unlimited</p>
          </div>
          <div className="rounded-lg border-2 border-primary/40 p-4">
            <p className="text-2xl font-bold text-foreground">£6.99</p>
            <p className="text-sm text-muted-foreground">30 days unlimited</p>
          </div>
        </div>

        <Button size="lg" className="w-full" disabled>
          Get a Trip Pass — Coming Soon
        </Button>
        <p className="text-xs text-muted-foreground">
          No subscription. Pay once, scan freely for the trip.
        </p>
      </CardContent>
    </Card>
  );
}
