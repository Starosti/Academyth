import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, Flame } from 'lucide-react';
import Layout from '@/components/Layout';
import { MedievalButton } from '@/components/ui/medieval-button';

interface DifficultyLevel {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  details: string;
}

const difficultyLevels: DifficultyLevel[] = [
  {
    id: 'easy',
    name: 'Easy',
    icon: Shield,
    description: 'A gentle introduction to the quest',
    details: 'A gentle introduction to the quest, with simpler questions and a less formidable dragon.'
  },
  {
    id: 'medium',
    name: 'Medium', 
    icon: Sword,
    description: 'A balanced challenge for your knowledge',
    details: 'A balanced challenge, testing your knowledge with moderately difficult questions and a stronger dragon.'
  },
  {
    id: 'hard',
    name: 'Hard',
    icon: Flame,
    description: 'The ultimate test of your skills',
    details: 'The ultimate test of your skills, featuring complex questions and a powerful dragon.'
  }
];

const ChooseChallenge: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');

  const handleBeginQuest = () => {
    navigate('/battle', { state: { difficulty: selectedDifficulty } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">Choose Your Challenge</h1>
            <p className="text-lg font-crimson text-muted-foreground max-w-2xl mx-auto">
              Select the difficulty level for your dragon battle. The harder the challenge, the greater the rewards!
            </p>
          </div>

          {/* Difficulty Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {difficultyLevels.map((level) => {
              const Icon = level.icon;
              const isSelected = selectedDifficulty === level.id;
              
              return (
                <div
                  key={level.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : ''
                  }`}
                  onClick={() => setSelectedDifficulty(level.id)}
                >
                  <div className={`bg-card/50 border-2 rounded-lg p-6 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow transition-all duration-300 ${
                    isSelected 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border/30 hover:border-border/60'
                  }`}>
                    <div className="text-center space-y-4">
                      <div className={`p-4 rounded-full mx-auto w-fit ${
                        isSelected ? 'bg-primary/20' : 'bg-muted/20'
                      } border border-border/30`}>
                        <Icon className={`h-8 w-8 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      
                      <h3 className="text-2xl font-cinzel font-semibold text-foreground">
                        {level.name}
                      </h3>
                      
                      <p className="text-sm font-crimson text-muted-foreground leading-relaxed">
                        {level.details}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Choice Display */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-card/50 border border-border/30 rounded-lg px-6 py-3 backdrop-blur-sm">
              <span className="font-crimson text-muted-foreground">Choice:</span>
              <span className="font-cinzel font-semibold text-primary capitalize">
                {selectedDifficulty}
              </span>
              <Sword className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Begin Quest Button */}
          <div className="text-center">
            <MedievalButton 
              onClick={handleBeginQuest}
              size="xl"
              className="px-12"
            >
              Begin Quest
            </MedievalButton>
          </div>

          {/* Topic Display */}
          <div className="mt-12 text-center">
            <div className="bg-card/30 border border-border/20 rounded-lg p-6 backdrop-blur-sm max-w-md mx-auto">
              <h3 className="font-crimson text-sm text-muted-foreground mb-2">Your topic:</h3>
              <p className="font-cinzel text-lg text-foreground font-semibold">
                Data Structures and Algorithms
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChooseChallenge;