import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, FileText, Upload, Loader2, ChefHat, Flame, Wine, Leaf } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Dish {
  name: string;
  description: string;
  ingredients: string[];
  probable_ingredients: string[];
  category: string;
  calories: number;
  allergens: string[];
  tags: string[];
}

export default function MenuUpload() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [menuText, setMenuText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeMenu = async () => {
    if (!imageFile && !menuText.trim()) {
      toast({
        title: "No input provided",
        description: "Please upload an image or paste menu text",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      let imageData = "";

      if (imageFile) {
        // Convert image to base64
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const { data, error } = await supabase.functions.invoke("parse-menu", {
        body: {
          image: imageData || null,
          text: menuText || null,
        },
      });

      if (error) throw error;

      if (data?.dishes && data.dishes.length > 0) {
        setDishes(data.dishes);

        // Store parsed menu in localStorage for Results page
        localStorage.setItem("parsedMenu", JSON.stringify(data.dishes));

        toast({
          title: "Menu analyzed!",
          description: `Found ${data.dishes.length} dishes`,
        });
      } else {
        toast({
          title: "No dishes found",
          description: "Try uploading a clearer image or adding more text",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing menu:", error);
      toast({
        title: "Analysis failed",
        description: "Please try again with a different image or text",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "starter":
        return "🥗";
      case "main":
        return "🍽️";
      case "dessert":
        return "🍰";
      case "beverage":
        return "🥤";
      default:
        return "🍴";
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "spicy":
        return <Flame className="w-4 h-4" />;
      case "alcohol":
        return <Wine className="w-4 h-4" />;
      case "vegetarian":
      case "vegan":
        return <Leaf className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">Upload or scan a menu</h1>
            <p className="text-lg text-muted-foreground">AI-powered menu analysis</p>
          </div>

          {!dishes.length ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="shadow-soft hover:shadow-hover transition-smooth">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Take a photo</CardTitle>
                    <CardDescription>Snap a picture of the menu</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-hover transition-smooth">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Paste menu text</CardTitle>
                    <CardDescription>Copy and paste the menu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste menu text here..."
                      value={menuText}
                      onChange={(e) => setMenuText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </div>

              {imagePreview && (
                <Card className="mb-6 shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg">Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={imagePreview}
                      alt="Menu preview"
                      className="w-full rounded-lg max-h-96 object-contain bg-muted"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="text-center">
                <Button
                  onClick={analyzeMenu}
                  disabled={isAnalyzing || (!imageFile && !menuText.trim())}
                  size="lg"
                  className="px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing your menu with AI...
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-4 h-4 mr-2" />
                      Analyze Menu
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Found {dishes.length} dishes</h2>
                <Button onClick={() => navigate("/results")} size="default">
                  Next: See Recommendations →
                </Button>
              </div>

              <div className="grid gap-4 mb-8">
                {dishes.map((dish, index) => (
                  <Card key={index} className="shadow-soft hover:shadow-hover transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getCategoryIcon(dish.category)}</span>
                            <CardTitle className="text-xl">{dish.name}</CardTitle>
                          </div>
                          <CardDescription className="text-base">{dish.description}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {dish.calories} cal
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Main Ingredients:</p>
                          <p className="text-sm text-foreground font-medium">{dish.ingredients.join(", ")}</p>
                        </div>

                        {dish.probable_ingredients && dish.probable_ingredients.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Probable Ingredients:</p>
                            <p className="text-sm text-muted-foreground italic">{dish.probable_ingredients.join(", ")}</p>
                          </div>
                        )}

                        {dish.allergens.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Allergens:</p>
                            <div className="flex flex-wrap gap-2">
                              {dish.allergens.map((allergen, i) => (
                                <Badge key={i} variant="destructive" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {dish.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {dish.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs gap-1">
                                {getTagIcon(tag)}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
