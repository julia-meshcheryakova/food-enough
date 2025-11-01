import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-menu-cache');
      
      if (error) throw error;

      toast({
        title: "Cache cleared",
        description: "Menu parse cache has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">Restaurant Admin</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Menu Parse Cache</CardTitle>
              <CardDescription>
                Clear all cached menu parsing results. This will force all menus to be re-parsed on next upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleClearCache}
                disabled={isClearing}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? "Clearing..." : "Clear Cache"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
