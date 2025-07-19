import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Trophy, Target, BookOpen, Calendar, Settings, LogOut } from 'lucide-react';
import Layout from '@/components/Layout';
import { MedievalButton } from '@/components/ui/medieval-button';

interface UserStats {
  totalDragonsDefeated: number;
  averageAccuracy: number;
  totalQuestsCompleted: number;
  favoriteSubjects: string[];
  joinDate: string;
  lastActive: string;
  streak: number;
}

const userStats: UserStats = {
  totalDragonsDefeated: 7,
  averageAccuracy: 82,
  totalQuestsCompleted: 12,
  favoriteSubjects: ['Data Structures', 'Algorithms', 'Medieval History'],
  joinDate: '2024-01-01',
  lastActive: '2024-01-18',
  streak: 5
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
  earnedDate?: string;
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Dragon Slayer',
    description: 'Defeat your first dragon',
    icon: Shield,
    earned: true,
    earnedDate: '2024-01-10'
  },
  {
    id: '2',
    title: 'Perfect Scholar',
    description: 'Achieve 100% accuracy in a quest',
    icon: Trophy,
    earned: true,
    earnedDate: '2024-01-12'
  },
  {
    id: '3',
    title: 'Persistent Warrior',
    description: 'Complete 5 quests in a row',
    icon: Target,
    earned: true,
    earnedDate: '2024-01-16'
  },
  {
    id: '4',
    title: 'Legendary Champion',
    description: 'Defeat 10 dragons',
    icon: Trophy,
    earned: false
  },
  {
    id: '5',
    title: 'Knowledge Keeper',
    description: 'Upload 10 scrolls',
    icon: BookOpen,
    earned: false
  }
];

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logging out...');
    navigate('/');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-card/50 border border-border/30 rounded-lg p-8 backdrop-blur-sm shadow-medieval mb-8">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center border-4 border-primary/20">
                  <Shield className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-cinzel font-bold">
                  7
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-cinzel font-bold text-foreground mb-2">Sir Scholar</h1>
                <p className="font-crimson text-muted-foreground mb-4">
                  Brave Knight of the Academy • Member since {userStats.joinDate}
                </p>
                <div className="flex items-center space-x-6 text-sm font-crimson">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Last active: {userStats.lastActive}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{userStats.streak} day streak</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <MedievalButton variant="parchment" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </MedievalButton>
                <MedievalButton variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </MedievalButton>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stats Overview */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-cinzel font-bold text-foreground mb-6">Battle Statistics</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
                  <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-cinzel font-bold text-primary mb-1">
                    {userStats.totalDragonsDefeated}
                  </div>
                  <div className="text-sm font-crimson text-muted-foreground">Dragons Defeated</div>
                </div>

                <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
                  <Target className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-cinzel font-bold text-primary mb-1">
                    {userStats.averageAccuracy}%
                  </div>
                  <div className="text-sm font-crimson text-muted-foreground">Average Accuracy</div>
                </div>

                <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
                  <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-cinzel font-bold text-primary mb-1">
                    {userStats.totalQuestsCompleted}
                  </div>
                  <div className="text-sm font-crimson text-muted-foreground">Quests Completed</div>
                </div>

                <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
                  <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-cinzel font-bold text-primary mb-1">
                    {userStats.favoriteSubjects.length}
                  </div>
                  <div className="text-sm font-crimson text-muted-foreground">Subject Areas</div>
                </div>
              </div>

              {/* Favorite Subjects */}
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-cinzel font-semibold text-foreground mb-4">Favorite Subjects</h3>
                <div className="flex flex-wrap gap-3">
                  {userStats.favoriteSubjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-crimson text-primary"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-foreground mb-6">Achievements</h2>
              
              <div className="space-y-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  
                  return (
                    <div
                      key={achievement.id}
                      className={`bg-card/50 border rounded-lg p-4 backdrop-blur-sm transition-all ${
                        achievement.earned
                          ? 'border-primary/30 shadow-gold-glow'
                          : 'border-border/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.earned 
                            ? 'bg-primary/20 border border-primary/30' 
                            : 'bg-muted/20 border border-border/30'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            achievement.earned ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className={`font-cinzel font-semibold mb-1 ${
                            achievement.earned ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {achievement.title}
                          </h4>
                          <p className="text-sm font-crimson text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {achievement.earned && achievement.earnedDate && (
                            <p className="text-xs font-crimson text-primary">
                              Earned: {achievement.earnedDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress to Next Achievement */}
              <div className="mt-6 bg-card/30 border border-border/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-cinzel font-semibold text-foreground mb-3">Next Goal</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-crimson">
                    <span className="text-muted-foreground">Legendary Champion</span>
                    <span className="text-primary">7/10</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-gold h-2 rounded-full transition-all duration-500"
                      style={{ width: '70%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;