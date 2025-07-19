import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Crown, Home, Sword, BookOpen, User, Shield } from "lucide-react";
import castleBg from "@/assets/castle-bg.png";
import logoNoText from "@/assets/logo-notext.png";
import logoHorizontal from "@/assets/logo-horizontal.png";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Battle", href: "/battle", icon: Sword },
    { name: "Library", href: "/library", icon: BookOpen },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Castle Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${castleBg})` }}
      />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <img src={logoHorizontal} className="h-10  logo" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md font-crimson transition-all ${
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-foreground hover:text-primary hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">{children}</main>
    </div>
  );
};

export default Layout;
