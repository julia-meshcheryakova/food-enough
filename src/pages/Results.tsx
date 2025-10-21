import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Results() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">Your recommendations</h1>
          <p className="text-lg text-muted-foreground">
            Coming soon: AI-powered dish recommendations
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
