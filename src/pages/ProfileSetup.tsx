import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const COMMON_ALLERGIES = ["gluten", "dairy", "nuts", "peanuts", "shellfish", "eggs", "soy", "fish"];

const COMMON_RESTRICTIONS = ["spicy", "raw", "pork", "beef", "alcohol"];

const DIETARY_GOALS = [
  { id: "healthy", label: "Healthy" },
  { id: "low-calorie", label: "Low-calorie" },
  { id: "budget", label: "Budget-friendly" },
  { id: "high-protein", label: "High-protein" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "low-carb", label: "Low-carb" },
  { id: "keto", label: "Keto" },
];

const PRESET_PROFILES = {
  child: {
    name: "Child",
    allergies: ["nuts"],
    restrictions: ["spicy", "alcohol"],
    hatedIngredients: [],
    favoriteIngredients: ["pasta", "chicken", "cheese"],
    goals: ["healthy"],
  },
  balancedAdult: {
    name: "Balanced Adult",
    allergies: [],
    restrictions: [],
    hatedIngredients: [],
    favoriteIngredients: ["chicken", "rice", "vegetables"],
    goals: ["healthy"],
  },
  fitnessEnthusiast: {
    name: "Fitness Enthusiast",
    allergies: [],
    restrictions: ["alcohol"],
    hatedIngredients: [],
    favoriteIngredients: ["eggs", "chicken", "oats", "yogurt"],
    goals: ["high-protein", "low-carb", "healthy"],
  },
  vegetarian: {
    name: "Vegetarian",
    allergies: [],
    restrictions: ["pork", "beef", "fish"],
    hatedIngredients: [],
    favoriteIngredients: ["tofu", "lentils", "spinach", "mushrooms"],
    goals: ["vegetarian", "healthy"],
  },
  vegan: {
    name: "Vegan",
    allergies: [],
    restrictions: ["pork", "beef", "fish", "eggs", "dairy"],
    hatedIngredients: [],
    favoriteIngredients: ["tofu", "beans", "quinoa", "avocado"],
    goals: ["vegan", "healthy"],
  },
  sensitiveEater: {
    name: "Sensitive Eater",
    allergies: ["gluten", "dairy"],
    restrictions: ["spicy", "alcohol"],
    hatedIngredients: [],
    favoriteIngredients: ["rice", "chicken", "carrots"],
    goals: ["healthy", "low-calorie"],
  },
};

export default function ProfileSetup() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allergies, setAllergies] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [hatedIngredients, setHatedIngredients] = useState<string[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [newHated, setNewHated] = useState("");
  const [newFavorite, setNewFavorite] = useState("");

  // Load existing profile from localStorage on mount, or default to balancedAdult
  useEffect(() => {
    const savedProfile = localStorage.getItem("foodEnoughProfile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setAllergies(profile.allergies || []);
        setRestrictions(profile.restrictions || []);
        setHatedIngredients(profile.hatedIngredients || []);
        setFavoriteIngredients(profile.favoriteIngredients || []);
        setGoals(profile.goals || []);
      } catch (error) {
        console.error("Failed to load saved profile:", error);
      }
    } else {
      // No saved profile, load balancedAdult as default
      const preset = PRESET_PROFILES.balancedAdult;
      setAllergies(preset.allergies);
      setRestrictions(preset.restrictions);
      setHatedIngredients(preset.hatedIngredients);
      setFavoriteIngredients(preset.favoriteIngredients);
      setGoals(preset.goals);
    }
  }, []);

  const toggleItem = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addIngredient = (
    value: string,
    list: string[],
    setList: (list: string[]) => void,
    setValue: (val: string) => void,
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeIngredient = (ingredient: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter((i) => i !== ingredient));
  };

  const handleSave = () => {
    const profile = {
      name: sessionStorage.getItem("currentProfileName") || "Custom",
      allergies,
      restrictions,
      hatedIngredients,
      favoriteIngredients,
      goals,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("foodEnoughProfile", JSON.stringify(profile));

    toast({
      title: "Profile saved!",
      description: "We'll remember your preferences next time you scan a menu.",
    });

    // Navigate to menu upload after a short delay
    setTimeout(() => {
      navigate("/menu");
    }, 1500);
  };

  const loadPreset = (presetKey: keyof typeof PRESET_PROFILES) => {
    const preset = PRESET_PROFILES[presetKey];
    setAllergies(preset.allergies);
    setRestrictions(preset.restrictions);
    setHatedIngredients(preset.hatedIngredients);
    setFavoriteIngredients(preset.favoriteIngredients);
    setGoals(preset.goals);

    // Auto-save preset profile to session
    const profile = {
      name: preset.name,
      allergies: preset.allergies,
      restrictions: preset.restrictions,
      hatedIngredients: preset.hatedIngredients,
      favoriteIngredients: preset.favoriteIngredients,
      goals: preset.goals,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("foodEnoughProfile", JSON.stringify(profile));
    sessionStorage.setItem("currentProfileName", preset.name);

    toast({
      title: `${preset.name}'s profile loaded & saved!`,
      description: "Ready to scan a menu with these preferences.",
    });
  };

  const hasAnyData =
    allergies.length > 0 ||
    restrictions.length > 0 ||
    hatedIngredients.length > 0 ||
    favoriteIngredients.length > 0 ||
    goals.length > 0;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-4">Set up your food profile</h1>
            <p className="text-lg text-muted-foreground">
              Tell us about your preferences so we can recommend the perfect dishes for you.
              <br /> We'll remember this next time you scan a menu.
            </p>
          </div>

          {/* Summary Card - Moved to Top */}
          {hasAnyData && (
            <Card className="bg-gradient-card shadow-soft border-2 border-primary/20 mb-8">
              <CardHeader>
                <CardTitle className="text-primary">Your Current Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Goals: </span>
                    <span className="text-muted-foreground">
                      {goals.map((g) => DIETARY_GOALS.find((dg) => dg.id === g)?.label).join(", ")}
                    </span>
                  </div>
                )}
                {allergies.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Allergies: </span>
                    <span className="text-muted-foreground">{allergies.join(", ")}</span>
                  </div>
                )}
                {restrictions.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Restrictions: </span>
                    <span className="text-muted-foreground">{restrictions.join(", ")}</span>
                  </div>
                )}
                {hatedIngredients.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Hated: </span>
                    <span className="text-muted-foreground">{hatedIngredients.join(", ")}</span>
                  </div>
                )}
                {favoriteIngredients.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Favorites: </span>
                    <span className="text-muted-foreground">{favoriteIngredients.join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Profile Presets */}
          <Card className="bg-primary/5 border-2 border-primary/30 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Quick Start Profiles</CardTitle>
              <CardDescription>Load a preset profile and customize it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("balancedAdult")}
                >
                  Balanced Adult
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("vegetarian")}
                >
                  Vegetarian
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("vegan")}
                >
                  Vegan
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("fitnessEnthusiast")}
                >
                  Fitness
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("child")}
                >
                  Child
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => loadPreset("sensitiveEater")}
                >
                  Sensitive Eater
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 mt-8">
            {/* Allergies & Restrictions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Allergies & Restrictions</CardTitle>
                <CardDescription>Select any allergies or dietary restrictions we should watch out for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block">Common Allergies</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant={allergies.includes(allergy) ? "destructive" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => toggleItem(allergy, allergies, setAllergies)}
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Other Restrictions</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_RESTRICTIONS.map((restriction) => (
                      <Badge
                        key={restriction}
                        variant={restrictions.includes(restriction) ? "destructive" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => toggleItem(restriction, restrictions, setRestrictions)}
                      >
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hated Ingredients */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Hated Ingredients</CardTitle>
                <CardDescription>Add ingredients you absolutely can't stand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g., cilantro, olives, mushrooms..."
                    value={newHated}
                    onChange={(e) => setNewHated(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addIngredient(newHated, hatedIngredients, setHatedIngredients, setNewHated);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => addIngredient(newHated, hatedIngredients, setHatedIngredients, setNewHated)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {hatedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hatedIngredients.map((ingredient) => (
                      <Badge key={ingredient} variant="destructive" className="px-3 py-1">
                        {ingredient}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => removeIngredient(ingredient, hatedIngredients, setHatedIngredients)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Ingredients */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Favorite Ingredients</CardTitle>
                <CardDescription>What ingredients do you love to see in your meals?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g., salmon, avocado, garlic..."
                    value={newFavorite}
                    onChange={(e) => setNewFavorite(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addIngredient(newFavorite, favoriteIngredients, setFavoriteIngredients, setNewFavorite);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addIngredient(newFavorite, favoriteIngredients, setFavoriteIngredients, setNewFavorite)
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {favoriteIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteIngredients.map((ingredient) => (
                      <Badge key={ingredient} className="px-3 py-1 bg-primary">
                        {ingredient}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => removeIngredient(ingredient, favoriteIngredients, setFavoriteIngredients)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Dietary Goals</CardTitle>
                <CardDescription>Select any goals that matter to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {DIETARY_GOALS.map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal.id}
                        checked={goals.includes(goal.id)}
                        onCheckedChange={() => toggleItem(goal.id, goals, setGoals)}
                      />
                      <Label
                        htmlFor={goal.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {goal.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-center pt-6">
              <Button variant="hero" size="lg" onClick={handleSave} disabled={!hasAnyData}>
                Save profile & continue
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
