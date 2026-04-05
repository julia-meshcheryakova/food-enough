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
        <CardTitle>Free Limit Reached</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          You've used <strong>{usageCount}</strong> of <strong>{limit}</strong> free menu analyses this month.
        </p>
        <p className="text-sm text-muted-foreground">
          Upgrade to Premium for unlimited analyses, priority image generation, and more.
        </p>
        <Button size="lg" className="w-full" disabled>
          Upgrade to Premium — Coming Soon
        </Button>
        <p className="text-xs text-muted-foreground">
          Your free analyses reset at the start of each month.
        </p>
      </CardContent>
    </Card>
  );
}
