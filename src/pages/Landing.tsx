import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Camera, CheckCircle, UserCircle, Sparkles } from "lucide-react";
import heroMenu from "@/assets/hero-menu.jpg";
import appMockup from "@/assets/app-mockup.png";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-24 pb-8 md:pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5 pointer-events-none"></div>
        <div className="container mx-auto max-w-3xl text-center">
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
              Your AI Waiter finds the <span className="text-primary">perfect dish</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Upload any menu or snap a photo. Get instant recommendations based on your taste, diet, and allergies.
            </p>
            <div>
              <Link to="/profile">
                <Button variant="hero" size="lg" className="shadow-hover">
                  Try It Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 bg-muted/30 mt-0">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple & Fast</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Three simple steps to your perfect meal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Let AI do the heavy lifting while you enjoy your food
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-gradient-card shadow-soft hover:shadow-hover transition-smooth hover:scale-105 border-border">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground text-center">1. Tell us your food rules</h3>
                <p className="text-muted-foreground text-center">
                  Set up your profile with allergies, dislikes, and dietary goals. We'll remember them for next time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-soft hover:shadow-hover transition-smooth hover:scale-105 border-border">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground text-center">2. Upload a menu</h3>
                <p className="text-muted-foreground text-center">
                  Snap a photo of the restaurant menu or paste the text. Our AI reads it instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-soft hover:shadow-hover transition-smooth hover:scale-105 border-border">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground text-center">3. Get your best choices</h3>
                <p className="text-muted-foreground text-center">
                  See the top 3 dishes matched to your preferences, with clear explanations why they're perfect for you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-2xl blur-3xl"></div>
                <img
                  src={heroMenu}
                  alt="Delicious restaurant menu spread"
                  className="rounded-2xl shadow-hover w-full h-auto relative z-10"
                />
              </div>
            </div>

            <div className="order-1 md:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Powered by AI</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Never struggle with menu decisions again
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're avoiding allergens, counting calories, or just can't stand cilantro — Food Enough
                remembers your preferences and finds dishes you'll actually love.
              </p>

              <ul className="space-y-4 pt-2">
                {[
                  "Instant allergy & restriction checking",
                  "Smart recommendations based on your goals",
                  "Works with any restaurant menu",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link to="/profile">
                  <Button variant="hero" size="lg" className="shadow-hover">
                    Get started now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="restaurants" className="pt-24 pb-16 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">Restaurant owner?</h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Embed Food Enough on your website or tablets to help customers choose confidently and reduce allergy
            concerns.
          </p>
          <Button variant="secondary" size="lg" className="shadow-hover">
            Coming soon...
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
