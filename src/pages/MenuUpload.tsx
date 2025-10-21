import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, FileText } from "lucide-react";

export default function MenuUpload() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">Upload or scan a menu</h1>
            <p className="text-lg text-muted-foreground">
              Coming soon: AI-powered menu analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Take a photo</CardTitle>
                <CardDescription>Snap a picture of the menu</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Feature coming soon
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-hover transition-smooth cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Paste menu text</CardTitle>
                <CardDescription>Copy and paste the menu</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Feature coming soon
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
