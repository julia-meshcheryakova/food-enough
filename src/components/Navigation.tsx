import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Utensils, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Utensils className="w-6 h-6 text-primary" />
            Food Enough
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant={location.pathname === "/profile" ? "default" : "outline"} size="sm">
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
