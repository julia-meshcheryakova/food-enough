import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Utensils, Flame, Star, AlertCircle } from "lucide-react";

interface Dish {
  name: string;
  description: string;
  ingredients: string[];
  category: string;
  calories: number;
  allergens: string[];
  tags: string[];
  score?: number;
  reasoning?: string[];
  imageUrl?: string | null;
  imageError?: boolean;
}

export default function Results() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get profile and menu from localStorage
        const profileData = localStorage.getItem('foodEnoughProfile');
        const menuData = localStorage.getItem('parsedMenu');

        if (!profileData || !menuData) {
          toast({
            title: "Missing data",
            description: "Please complete your profile and upload a menu first.",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }

        const profile = JSON.parse(profileData);
        const menu = JSON.parse(menuData);
        
        // Store in session for this page load
        sessionStorage.setItem("activeProfile", JSON.stringify(profile));
        sessionStorage.setItem("activeMenu", JSON.stringify(menu));

        console.log("Calling recommend-dishes with:", { 
          profileName: profile.name,
          dishCount: menu.dishes?.length 
        });

        // Call the recommend-dishes edge function
        const { data, error } = await supabase.functions.invoke('recommend-dishes', {
          body: { profile, menu }
        });

        if (error) {
          console.error("Error from recommend-dishes:", error);
          throw error;
        }

        console.log("Received recommendations:", data);

        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to generate recommendations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [navigate]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'starter':
      case 'appetizer':
        return <Utensils className="w-4 h-4" />;
      case 'main':
      case 'main course':
        return <Flame className="w-4 h-4" />;
      case 'dessert':
        return <Star className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">Your Top Recommendations</h1>
            <p className="text-lg text-muted-foreground">
              {(() => {
                try {
                  const profile = JSON.parse(sessionStorage.getItem("activeProfile") || "{}");
                  return profile.name ? `Personalized for ${profile.name}` : "Based on your preferences and dietary requirements";
                } catch {
                  return "Based on your preferences and dietary requirements";
                }
              })()}
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">
                  No recommendations available. Please upload a menu first.
                </p>
                <Button onClick={() => navigate('/menu')}>
                  Upload Menu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
                {recommendations.map((dish, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="p-0">
                      {dish.imageUrl ? (
                        <img 
                          src={dish.imageUrl} 
                          alt={dish.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : dish.imageError ? (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <Utensils className="w-12 h-12 text-muted-foreground" />
                        </div>
                      ) : (
                        <Skeleton className="w-full h-48" />
                      )}
                    </CardHeader>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="gap-1">
                          {getCategoryIcon(dish.category)}
                          {dish.category}
                        </Badge>
                        <Badge variant="outline">
                          {dish.calories} kcal
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{dish.name}</CardTitle>
                      <CardDescription>{dish.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dish.reasoning && dish.reasoning.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">Why we recommend this:</h4>
                          <ul className="space-y-1">
                            {dish.reasoning.map((reason, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dish.allergens.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-semibold text-xs mb-1">Allergens:</h4>
                          <div className="flex flex-wrap gap-1">
                            {dish.allergens.map((allergen, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {dish.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dish.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => navigate('/menu')}
                  variant="outline"
                  size="lg"
                >
                  Try Another Menu
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
