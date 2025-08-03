import React from "react";
import { useNavigate } from "react-router-dom";
import { Scroll, Sword, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import ActionCard from "@/components/ActionCard";
import dragonHero from "@/assets/dragon-hero.png";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="relative rounded-lg overflow-hidden mb-12 shadow-medieval">
          <div
            className="h-96 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${dragonHero})` }}
          >
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white max-w-2xl mx-auto px-6">
                <h1 className="text-5xl font-cinzel font-bold mb-4 text-shadow-lg">
                  Forge Your Mind. Face the Dragon.
                </h1>
                <p className="text-xl font-crimson mb-8 text-shadow">
                  Welcome to ACADEMYTH, where knowledge becomes your weapon
                  against the fiercest of beasts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ActionCard
            title="Upload Scrolls"
            description="Prepare your knowledge for the dragon's challenge. Upload your study materials to generate questions for the battle."
            icon={Scroll}
            onClick={() => navigate("/upload")}
            variant="primary"
          />

          <ActionCard
            title="Visit Your Library"
            description="Review your scrolls, replay previous quests, and track your progress in the halls of learning."
            icon={BookOpen}
            onClick={() => navigate("/library")}
            variant="primary"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
