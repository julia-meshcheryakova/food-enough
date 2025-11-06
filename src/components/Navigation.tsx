import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Utensils, User } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isProfile = location.pathname === "/profile";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Utensils className="w-6 h-6 text-primary" />
            Food Enough
          </Link>
          
          <div className="flex items-center gap-4">
            {!isHome && !isProfile && (
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
            )}
            <Link to="/profile">
              <Button variant={location.pathname === "/profile" ? "default" : "outline"}>
                <User className="w-4 h-4" />
                My Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
