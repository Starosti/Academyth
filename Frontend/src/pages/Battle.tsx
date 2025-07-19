import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Shield as ShieldIcon, Timer } from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";
import DragonPixiGame from "@/components/DragonPixiGame";

// Game configuration constants
const GAME_CONFIG = {
  INITIAL_PLAYER_HP: 100,
  INITIAL_DRAGON_HP: 100,
  QUESTION_TIME_LIMIT: 30,
  DAMAGE_PER_QUESTION: 20,
  ANIMATION_DURATION: 600,
  FEEDBACK_DISPLAY_DURATION: 1500,
  TIMER_INTERVAL: 1000,
  MAX_HP: 100,
};

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["Berlin", "Paris", "Madrid", "Rome"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "Which algorithm has O(log n) time complexity?",
    options: [
      "Linear Search",
      "Binary Search",
      "Bubble Sort",
      "Selection Sort",
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "What is the most powerful spell against dark magic?",
    options: ["Expelliarmus", "Avada Kedavra", "Protego", "Expecto Patronum"],
    correctAnswer: 3,
  },
  {
    id: 4,
    question: "Describe the habitat of the Phoenix.",
    options: [
      "Ocean depths",
      "High mountain peaks and volcanic regions",
      "Dense forests",
      "Underground caves",
    ],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "What are the properties of Unicorn blood?",
    options: [
      "Life-saving and healing",
      "Poisonous",
      "Magical enhancement",
      "Memory restoration",
    ],
    correctAnswer: 0,
  },
];

const Battle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [playerHP, setPlayerHP] = useState(GAME_CONFIG.INITIAL_PLAYER_HP);
  const [dragonHP, setDragonHP] = useState(GAME_CONFIG.INITIAL_DRAGON_HP);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.QUESTION_TIME_LIMIT);
  const [answers, setAnswers] = useState<number[]>([]);
  const [answerResults, setAnswerResults] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Dragon animation states
  const [dragonTakingDamage, setDragonTakingDamage] = useState(false);
  const [dragonHealing, setDragonHealing] = useState(false);
  const [dragonAttacking, setDragonAttacking] = useState(false);

  const handleSubmit = useCallback(() => {
    const currentQ = sampleQuestions[currentQuestion];
    const correct = selectedAnswer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer ?? -1;
    setAnswers(newAnswers);

    const newAnswerResults = [...answerResults];
    newAnswerResults[currentQuestion] = correct;
    setAnswerResults(newAnswerResults);

    if (correct) {
      setDragonHP(Math.max(0, dragonHP - GAME_CONFIG.DAMAGE_PER_QUESTION));
      setDragonTakingDamage(true);
      setTimeout(
        () => setDragonTakingDamage(false),
        GAME_CONFIG.ANIMATION_DURATION
      );
    } else {
      setPlayerHP(Math.max(0, playerHP - GAME_CONFIG.DAMAGE_PER_QUESTION));
      setDragonAttacking(true);
      setTimeout(
        () => setDragonAttacking(false),
        GAME_CONFIG.ANIMATION_DURATION
      );
    }

    setTimeout(() => {
      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(GAME_CONFIG.QUESTION_TIME_LIMIT);
        setShowFeedback(false);
      } else {
        // Battle complete
        navigate("/summary", {
          state: {
            answers: newAnswers,
            questions: sampleQuestions,
            playerHP,
            dragonHP: correct
              ? Math.max(0, dragonHP - GAME_CONFIG.DAMAGE_PER_QUESTION)
              : dragonHP,
          },
        });
      }
    }, GAME_CONFIG.FEEDBACK_DISPLAY_DURATION);
  }, [currentQuestion, selectedAnswer, answers, dragonHP, playerHP, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(
        () => setTimeLeft(timeLeft - 1),
        GAME_CONFIG.TIMER_INTERVAL
      );
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleSubmit();
    }
  }, [timeLeft, showFeedback, handleSubmit]);

  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Health Bars */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Player Health */}
            <div className="bg-card/50 border border-border/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-2">
                <ShieldIcon className="h-5 w-5 text-success" />
                <span className="font-cinzel font-semibold text-foreground">
                  Knight
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-4 border border-border/20">
                <div
                  className="bg-success h-4 rounded-full transition-all duration-500"
                  style={{ width: `${playerHP}%` }}
                />
              </div>
              <div className="text-right mt-1">
                <span className="text-sm font-crimson text-success">
                  {playerHP}/{GAME_CONFIG.MAX_HP} HP
                </span>
              </div>
            </div>

            {/* Dragon Health */}
            <div className="bg-card/50 border border-border/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Heart className="h-5 w-5 text-destructive" />
                <span className="font-cinzel font-semibold text-foreground">
                  Dragon
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-4 border border-border/20">
                <div
                  className="bg-destructive h-4 rounded-full transition-all duration-500"
                  style={{ width: `${dragonHP}%` }}
                />
              </div>
              <div className="text-right mt-1">
                <span className="text-sm font-crimson text-destructive">
                  {dragonHP}/{GAME_CONFIG.MAX_HP} HP
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Question Panel */}
            <div className="order-2 lg:order-1">
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-cinzel font-semibold text-primary">
                    Question {currentQuestion + 1}/{sampleQuestions.length}
                  </h2>
                  <div className="text-xl flex items-center space-x-2 text-muted-foreground">
                    <span className="font-crimson">{timeLeft}s</span>
                    <Timer className="h-6 w-6" />
                  </div>
                </div>

                {/* Question */}
                <h3 className="text-xl font-crimson font-medium mb-6 text-foreground leading-relaxed">
                  {sampleQuestions[currentQuestion].question}
                </h3>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {sampleQuestions[currentQuestion].options.map(
                    (option, index) => (
                      <label
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedAnswer === index
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/30 bg-muted/10 hover:border-border/50"
                        } ${showFeedback ? "pointer-events-none" : ""}`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index}
                          checked={selectedAnswer === index}
                          onChange={() => setSelectedAnswer(index)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            selectedAnswer === index
                              ? "border-primary bg-primary"
                              : "border-border bg-background"
                          }`}
                        />
                        <span className="font-crimson text-foreground">
                          {option}
                        </span>
                      </label>
                    )
                  )}
                </div>

                {/* Submit Button */}
                {!showFeedback && (
                  <MedievalButton
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className="w-full"
                  >
                    Cast Spell
                  </MedievalButton>
                )}

                {/* Feedback */}
                {showFeedback && (
                  <div
                    className={`text-center p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-success/50 bg-success/10 text-success"
                        : "border-destructive/50 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <p className="font-cinzel font-semibold">
                      {isCorrect
                        ? "⚔️ Critical Hit!"
                        : "🛡️ Dragon Strikes Back!"}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Dots */}
              <div className="mt-6">
                <div className="flex flex-col gap-2 justify-center items-center text-sm font-crimson text-muted-foreground mb-2">
                  <div className="flex justify-center items-center space-x-2">
                    {sampleQuestions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          index < currentQuestion
                            ? answerResults[index]
                              ? "bg-success border-success"
                              : "bg-destructive border-destructive"
                            : index === currentQuestion
                            ? "border-primary border-2"
                            : "bg-muted/30 border-border/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {currentQuestion + 1}/{sampleQuestions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Dragon Game Panel */}
            <div className="order-1 lg:order-2">
              <div className="bg-card/30 border border-border/20 rounded-lg overflow-hidden shadow-medieval h-96 lg:h-full relative">
                <DragonPixiGame
                  dragonHP={dragonHP}
                  onDamage={dragonTakingDamage}
                  onHeal={dragonHealing}
                  onAttack={dragonAttacking}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4">
                    <p className="text-sm font-crimson text-center text-muted-foreground">
                      {dragonHP > 0
                        ? "The dragon's eyes burn with ancient knowledge, testing your resolve..."
                        : "The mighty beast has been defeated! Victory is yours!"}
                    </p>
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

export default Battle;
