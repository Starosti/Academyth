import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-6xl font-cinzel font-bold mb-4 text-primary">404</h1>
        <h2 className="text-2xl font-cinzel font-semibold mb-4 text-foreground">Quest Not Found</h2>
        <p className="text-lg font-crimson text-muted-foreground mb-8">
          The path you seek has been consumed by dragon fire. Return to safe grounds, brave adventurer.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-6 py-3 bg-gradient-gold text-primary-foreground rounded-md font-cinzel font-medium hover:bg-gradient-gold/90 transition-all shadow-medieval hover:shadow-gold-glow"
        >
          Return to Academy
        </a>
      </div>
    </div>
  );
};

export default NotFound;
