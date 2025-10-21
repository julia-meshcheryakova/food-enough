import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Chat() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">AI Waiter Chat</h1>
          <p className="text-lg text-muted-foreground">
            Coming soon: Chat with your AI waiter about menu options
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
