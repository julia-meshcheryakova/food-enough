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
  const [isClearingMenuCache, setIsClearingMenuCache] = useState(false);
  const [isClearingImageCache, setIsClearingImageCache] = useState(false);

  const handleClearMenuCache = async () => {
    setIsClearingMenuCache(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-menu-cache');
      
      if (error) throw error;

      toast({
        title: "Cache cleared",
        description: "Menu parse cache has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing menu cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear menu cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearingMenuCache(false);
    }
  };

  const handleClearImageCache = async () => {
    setIsClearingImageCache(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-dish-image-cache');
      
      if (error) throw error;

      toast({
        title: "Cache cleared",
        description: "Dish image cache has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing image cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear image cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearingImageCache(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">Restaurant Admin</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Menu Parse Cache</CardTitle>
                <CardDescription>
                  Clear all cached menu parsing results. This will force all menus to be re-parsed on next upload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleClearMenuCache}
                  disabled={isClearingMenuCache}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearingMenuCache ? "Clearing..." : "Clear Menu Cache"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dish Image Cache</CardTitle>
                <CardDescription>
                  Clear all cached dish images. This will force all dish images to be regenerated on next recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleClearImageCache}
                  disabled={isClearingImageCache}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearingImageCache ? "Clearing..." : "Clear Image Cache"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
