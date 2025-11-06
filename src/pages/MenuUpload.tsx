import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, FileText, Upload, Loader2, ChefHat, Flame, Wine, Leaf, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { appConfig } from "@/config/app";

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [menuText, setMenuText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load saved images and text on mount
  useEffect(() => {
    const savedPreviews = sessionStorage.getItem("menuImagePreviews");
    const savedText = sessionStorage.getItem("menuText");
    const savedParsedMenu = sessionStorage.getItem("parsedMenu");
    
    if (savedPreviews) {
      try {
        const previews = JSON.parse(savedPreviews);
        setImagePreviews(previews);
      } catch (error) {
        console.error("Failed to load saved image previews:", error);
      }
    }
    
    if (savedText) {
      setMenuText(savedText);
    }

    if (savedParsedMenu) {
      try {
        const parsed = JSON.parse(savedParsedMenu);
        setDishes(parsed);
      } catch (error) {
        console.error("Failed to load saved parsed menu:", error);
      }
    }
  }, []);

  // Save images and text whenever they change
  useEffect(() => {
    if (imagePreviews.length > 0) {
      sessionStorage.setItem("menuImagePreviews", JSON.stringify(imagePreviews));
    } else {
      sessionStorage.removeItem("menuImagePreviews");
    }
  }, [imagePreviews]);

  useEffect(() => {
    if (menuText) {
      sessionStorage.setItem("menuText", menuText);
    } else {
      sessionStorage.removeItem("menuText");
    }
  }, [menuText]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (imageFiles.length >= 3) {
      toast({
        title: "Maximum images reached",
        description: "You can upload up to 3 menu images",
        variant: "destructive",
      });
      return;
    }

    setImageFiles(prev => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreviews(prev => [...prev, event.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const processMultipleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = 3 - imageFiles.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (fileArray.length > remainingSlots) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload ${remainingSlots} more image(s)`,
        variant: "destructive",
      });
    }

    filesToProcess.forEach(file => {
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processMultipleFiles(files);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files) {
      processMultipleFiles(files);
    }
  };

  const analyzeMenu = async () => {
    if (imageFiles.length === 0 && !menuText.trim()) {
      toast({
        title: "No input provided",
        description: "Please upload at least one image or paste menu text",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      let allDishes: Dish[] = [];

      // Process all images
      for (const imageFile of imageFiles) {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const { data, error } = await supabase.functions.invoke("parse-menu", {
          body: {
            image: imageData,
            text: null,
            useCache: appConfig.useCache,
          },
        });

        if (error) {
          console.error('Error parsing image:', error);
          continue;
        }

        if (data?.dishes) {
          allDishes = [...allDishes, ...data.dishes];
        }
      }

      // Process text if provided
      if (menuText.trim()) {
        const { data, error } = await supabase.functions.invoke("parse-menu", {
          body: {
            image: null,
            text: menuText,
            useCache: appConfig.useCache,
          },
        });

        if (!error && data?.dishes) {
          allDishes = [...allDishes, ...data.dishes];
        }
      }

      if (allDishes.length > 0) {
        setDishes(allDishes);

        // Store parsed menu in sessionStorage and localStorage
        sessionStorage.setItem("parsedMenu", JSON.stringify(allDishes));
        localStorage.setItem("parsedMenu", JSON.stringify(allDishes));

        toast({
          title: "Menu analyzed!",
          description: `Found ${allDishes.length} dishes`,
        });
      } else {
        toast({
          title: "No dishes found",
          description: "Try uploading clearer images or adding more text",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing menu:", error);
      toast({
        title: "Analysis failed",
        description: "Please try again with different images or text",
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
              <Card className="shadow-soft hover:shadow-hover transition-smooth">
                <CardContent className="pt-8 pb-8">
                  <Tabs defaultValue="photo" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                      <TabsTrigger value="photo">
                        <Camera className="w-4 h-4 mr-2" />
                        Photo
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <FileText className="w-4 h-4 mr-2" />
                        Text
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="photo" className="space-y-4">
                      <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        }`}
                      >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop images here
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Up to 3 menu images • or use buttons below
                        </p>
                      </div>
                      
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => cameraInputRef.current?.click()} 
                          variant="default" 
                          className="w-full"
                          size="lg"
                          disabled={imageFiles.length >= 3}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Camera
                        </Button>
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          variant="outline" 
                          className="w-full"
                          size="lg"
                          disabled={imageFiles.length >= 3}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>

                      {imagePreviews.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center">
                          {imagePreviews.length} / 3 images uploaded
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="text" className="mt-0">
                      <Textarea
                        placeholder="Paste menu text here..."
                        value={menuText}
                        onChange={(e) => setMenuText(e.target.value)}
                        className="min-h-[240px]"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {imagePreviews.length > 0 && (
                <Card className="my-8 shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg">Image Previews ({imagePreviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Menu preview ${index + 1}`}
                            className="w-full rounded-lg max-h-64 object-contain bg-muted"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center mt-8">
                <Button
                  onClick={analyzeMenu}
                  disabled={isAnalyzing || (imageFiles.length === 0 && !menuText.trim())}
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
                  See recommendations →
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
