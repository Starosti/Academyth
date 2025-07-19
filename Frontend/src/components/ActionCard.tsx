import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MedievalButton } from './ui/medieval-button';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  variant = 'default' 
}) => {
  const getCardStyles = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary/30 bg-gradient-gold/10 hover:border-primary/50';
      case 'secondary':
        return 'border-secondary/30 bg-gradient-parchment/10 hover:border-secondary/50';
      default:
        return 'border-border/30 bg-card/50 hover:border-border/60';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow cursor-pointer group ${getCardStyles()}`}
         onClick={onClick}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-muted/20 border border-border/30 group-hover:border-primary/30 transition-colors">
          <Icon className="h-8 w-8 text-primary group-hover:text-primary/80" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-cinzel font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm font-crimson text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <MedievalButton 
          variant={variant === 'primary' ? 'default' : 'parchment'}
          className="group-hover:scale-105 transition-transform"
        >
          Begin
        </MedievalButton>
      </div>
    </div>
  );
};

export default ActionCard;