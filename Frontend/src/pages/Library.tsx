import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, HardDrive, Play, BarChart3, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { MedievalButton } from '@/components/ui/medieval-button';

interface Scroll {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  lastUsed: string;
  questsGenerated: number;
}

interface Quest {
  id: string;
  title: string;
  difficulty: string;
  score: number;
  date: string;
  scrollUsed: string;
}

const sampleScrolls: Scroll[] = [
  {
    id: '1',
    name: 'Data_Structures_Chapter_1.pdf',
    uploadDate: '2024-01-15',
    size: '2.3 MB',
    lastUsed: '2024-01-18',
    questsGenerated: 3
  },
  {
    id: '2', 
    name: 'Algorithms_Study_Guide.docx',
    uploadDate: '2024-01-10',
    size: '1.8 MB',
    lastUsed: '2024-01-16',
    questsGenerated: 2
  },
  {
    id: '3',
    name: 'Medieval_History_Notes.txt',
    uploadDate: '2024-01-05',
    size: '0.5 MB',
    lastUsed: '2024-01-12',
    questsGenerated: 1
  }
];

const sampleQuests: Quest[] = [
  {
    id: '1',
    title: 'Dragon of Algorithms',
    difficulty: 'Medium',
    score: 85,
    date: '2024-01-18',
    scrollUsed: 'Data_Structures_Chapter_1.pdf'
  },
  {
    id: '2',
    title: 'Beast of Binary Trees',
    difficulty: 'Hard', 
    score: 72,
    date: '2024-01-16',
    scrollUsed: 'Algorithms_Study_Guide.docx'
  },
  {
    id: '3',
    title: 'Wyvern of Medieval Lore',
    difficulty: 'Easy',
    score: 94,
    date: '2024-01-12',
    scrollUsed: 'Medieval_History_Notes.txt'
  }
];

const Library: React.FC = () => {
  const navigate = useNavigate();

  const handleReplay = (quest: Quest) => {
    navigate('/choose-challenge', { state: { questId: quest.id } });
  };

  const handleReviewSummary = (quest: Quest) => {
    navigate('/summary', { state: { questId: quest.id } });
  };

  const handleDeleteScroll = (scrollId: string) => {
    // Handle deletion logic here
    console.log('Delete scroll:', scrollId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-success border-success/50 bg-success/10';
      case 'medium': return 'text-primary border-primary/50 bg-primary/10';
      case 'hard': return 'text-destructive border-destructive/50 bg-destructive/10';
      default: return 'text-muted-foreground border-border/50 bg-muted/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    return 'text-destructive';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">Your Library</h1>
            <p className="text-lg font-crimson text-muted-foreground">
              Manage your uploaded scrolls and review your legendary quests and victories.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Scrolls Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-cinzel font-bold text-foreground">Your Scrolls</h2>
                <MedievalButton 
                  variant="parchment"
                  onClick={() => navigate('/upload')}
                  size="sm"
                >
                  Upload New
                </MedievalButton>
              </div>

              <div className="space-y-4">
                {sampleScrolls.map((scroll) => (
                  <div key={scroll.id} className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-muted/20 border border-border/30 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-cinzel font-semibold text-foreground mb-2">{scroll.name}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm font-crimson text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{scroll.uploadDate}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <HardDrive className="h-4 w-4" />
                              <span>{scroll.size}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm font-crimson text-muted-foreground">
                            <span className="text-primary font-semibold">{scroll.questsGenerated}</span> quests generated
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MedievalButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate('/choose-challenge', { state: { scrollId: scroll.id } })}
                        >
                          <Play className="h-4 w-4" />
                        </MedievalButton>
                        <MedievalButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteScroll(scroll.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </MedievalButton>
                      </div>
                    </div>
                  </div>
                ))}

                {sampleScrolls.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-cinzel font-semibold text-muted-foreground mb-2">No Scrolls Yet</h3>
                    <p className="font-crimson text-muted-foreground mb-6">Upload your first scroll to begin your journey.</p>
                    <MedievalButton onClick={() => navigate('/upload')}>
                      Upload Scroll
                    </MedievalButton>
                  </div>
                )}
              </div>
            </div>

            {/* Quest History Section */}
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-foreground mb-6">Quest History</h2>
              
              <div className="space-y-4">
                {sampleQuests.map((quest) => (
                  <div key={quest.id} className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-cinzel font-semibold text-foreground mb-2">{quest.title}</h3>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-crimson font-medium border ${getDifficultyColor(quest.difficulty)}`}>
                            {quest.difficulty}
                          </span>
                          <span className={`text-2xl font-cinzel font-bold ${getScoreColor(quest.score)}`}>
                            {quest.score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MedievalButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleReplay(quest)}
                          title="Replay Quest"
                        >
                          <Play className="h-4 w-4" />
                        </MedievalButton>
                        <MedievalButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleReviewSummary(quest)}
                          title="Review Summary"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </MedievalButton>
                      </div>
                    </div>
                    
                    <div className="text-sm font-crimson text-muted-foreground">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>{quest.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{quest.scrollUsed}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {sampleQuests.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-cinzel font-semibold text-muted-foreground mb-2">No Quests Completed</h3>
                    <p className="font-crimson text-muted-foreground mb-6">Start your first battle to see your quest history.</p>
                    <MedievalButton onClick={() => navigate('/choose-challenge')}>
                      Begin Quest
                    </MedievalButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Library;