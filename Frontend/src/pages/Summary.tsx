import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface APIQuestion {
  question: string;
  answerOptions: AnswerOption[];
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface SummaryState {
  answers: number[];
  questions: Question[];
  playerHP: number;
  dragonHP: number;
  difficulty?: string;
  fileName?: string;
  originalAPIQuestions?: APIQuestion[];
  timeSpent?: number; // Time spent in seconds
}

interface PerformanceAnalysis {
  accuracy: number;
  correct_answers: number;
  total_questions: number;
  difficulty: string;
  detailed_analysis: string;
  performance_level: string;
}

const Summary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SummaryState;

  // Performance analysis state
  const [performanceAnalysis, setPerformanceAnalysis] =
    useState<PerformanceAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fallback data if no state is passed
  const answers = state?.answers || [1, 1, 0, 1, 0];
  const questions = state?.questions || [
    {
      id: 1,
      question: "What is the significance of the Philosopher's Stone?",
      options: [
        "Immortality and transmutation of metals",
        "Time travel",
        "Mind reading",
        "Levitation",
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      question: "Name three ingredients for a healing potion.",
      options: [
        "Moonpetal, Sunroot, and Dragon Scale",
        "Water, Salt, Sugar",
        "Gold, Silver, Bronze",
        "Fire, Earth, Water",
      ],
      correctAnswer: 0,
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

  const originalAPIQuestions = state?.originalAPIQuestions;

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  };

  // API call to get performance analysis
  const fetchPerformanceAnalysis = async () => {
    try {
      setIsLoadingAnalysis(true);
      setAnalysisError(null);

      const response = await fetch(
        "http://localhost:5000/analyze_performance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: answers,
            questions: questions,
            difficulty: state?.difficulty || "Orta",
            documentId: state?.fileName, // This might need to be adjusted based on your data structure
            timeSpent: state?.timeSpent || 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Performance analysis failed");
      }

      const data = await response.json();
      setPerformanceAnalysis(data.analysis);
    } catch (error) {
      console.error("Error fetching performance analysis:", error);
      setAnalysisError("Performans analizi yüklenemedi.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Fetch performance analysis on component mount
  useEffect(() => {
    if (answers.length > 0 && questions.length > 0) {
      fetchPerformanceAnalysis();
    } else {
      setIsLoadingAnalysis(false);
    }
  }, [answers.length, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to get rationale for a specific question and answer
  const getRationale = (questionIndex: number, answerIndex: number): string => {
    if (!originalAPIQuestions || questionIndex >= originalAPIQuestions.length) {
      return "";
    }

    const apiQuestion = originalAPIQuestions[questionIndex];
    if (answerIndex >= 0 && answerIndex < apiQuestion.answerOptions.length) {
      return apiQuestion.answerOptions[answerIndex].rationale;
    }

    return "";
  };

  // Helper function to get the correct answer and its rationale
  const getCorrectAnswerInfo = (questionIndex: number) => {
    if (!originalAPIQuestions || questionIndex >= originalAPIQuestions.length) {
      return { answer: "", rationale: "" };
    }

    const apiQuestion = originalAPIQuestions[questionIndex];
    const correctOption = apiQuestion.answerOptions.find(
      (option) => option.isCorrect
    );

    return {
      answer: correctOption?.text || "",
      rationale: correctOption?.rationale || "",
    };
  };

  const correctAnswers = answers.filter(
    (answer, index) => answer === questions[index].correctAnswer
  ).length;
  const accuracy = Math.round((correctAnswers / questions.length) * 100);

  // Calculate actual time spent or use fallback
  const actualTimeSpent = state?.timeSpent || 0;
  const timeSpent =
    actualTimeSpent > 0 ? formatTime(actualTimeSpent) : "Not recorded";

  console.log("Summary data:", {
    actualTimeSpent,
    formattedTime: timeSpent,
    stateTimeSpent: state?.timeSpent,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">
              Quest Summary
            </h1>
            <p className="text-lg font-crimson text-muted-foreground">
              Congratulations, brave knight! You have completed your quest.
              Here's a summary of your performance:
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-sm font-crimson text-muted-foreground mb-1">
                Accuracy
              </div>
              <div className="text-3xl font-cinzel font-bold text-primary">
                {accuracy}%
              </div>
            </div>

            <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-sm font-crimson text-muted-foreground mb-1">
                Time Spent
              </div>
              <div className="text-3xl font-cinzel font-bold text-primary">
                {timeSpent}
              </div>
            </div>

            <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-sm font-crimson text-muted-foreground mb-1">
                Questions Answered
              </div>
              <div className="text-3xl font-cinzel font-bold text-primary">
                {questions.length}
              </div>
            </div>
            {/* Performance Analysis */}
            <div className="col-span-3 bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval">
              <h2 className="text-2xl font-cinzel font-bold mb-6 text-foreground">
                Performance Analysis
              </h2>

              {isLoadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="font-crimson text-muted-foreground">
                    Analyzing your performance...
                  </span>
                </div>
              ) : analysisError ? (
                <div className="text-center py-8">
                  <p className="font-crimson text-destructive mb-4">
                    {analysisError}
                  </p>
                  <MedievalButton
                    variant="parchment"
                    onClick={fetchPerformanceAnalysis}
                    className="text-sm"
                  >
                    Retry Analysis
                  </MedievalButton>
                </div>
              ) : performanceAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-cinzel text-lg text-foreground">
                      Performance Level:
                    </span>
                    <span
                      className={`font-cinzel font-semibold px-3 py-1 rounded-full text-sm ${
                        performanceAnalysis.performance_level === "Mükemmel"
                          ? "bg-success/20 text-success"
                          : performanceAnalysis.performance_level === "Çok İyi"
                          ? "bg-primary/20 text-primary"
                          : performanceAnalysis.performance_level === "İyi"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {performanceAnalysis.performance_level}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <div className="font-crimson text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {performanceAnalysis.detailed_analysis}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="font-crimson text-muted-foreground leading-relaxed">
                  Your performance in this quest was{" "}
                  {accuracy >= 80
                    ? "commendable"
                    : accuracy >= 60
                    ? "satisfactory"
                    : "needs improvement"}
                  , demonstrating a {accuracy >= 80 ? "strong" : "developing"}{" "}
                  grasp of the material. You excelled in areas such as{" "}
                  {correctAnswers >= 3
                    ? "History of Magic and Potion Making"
                    : "basic fundamentals"}
                  , but could benefit from further study in{" "}
                  {correctAnswers < 4
                    ? "Advanced Spells and Mythical Creatures"
                    : "specialized topics"}
                  . Overall, your strategic approach and{" "}
                  {accuracy >= 70 ? "quick thinking" : "careful consideration"}{" "}
                  were evident throughout the challenge.
                </p>
              )}
            </div>

            {/* Stats Cards */}
          </div>

          {/* Questions Review */}
          <div className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval">
            <h2 className="text-2xl font-cinzel font-bold mb-6 text-foreground">
              Questions Review
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 font-cinzel font-semibold text-muted-foreground">
                      Question
                    </th>
                    <th className="text-left p-4 font-cinzel font-semibold text-muted-foreground">
                      Your Answer
                    </th>
                    <th className="text-left p-4 font-cinzel font-semibold text-muted-foreground">
                      Correct Answer
                    </th>
                    <th className="text-center p-4 font-cinzel font-semibold text-muted-foreground">
                      Result
                    </th>
                    <th className="text-left p-4 font-cinzel font-semibold text-muted-foreground">
                      Explanation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => {
                    const isCorrect = answers[index] === question.correctAnswer;
                    const userAnswer =
                      answers[index] >= 0
                        ? question.options[answers[index]]
                        : "Not answered";
                    const userRationale = getRationale(index, answers[index]);
                    const correctAnswerInfo = getCorrectAnswerInfo(index);
                    const correctAnswer =
                      correctAnswerInfo.answer ||
                      question.options[question.correctAnswer];

                    return (
                      <tr
                        key={question.id}
                        className="border-b border-border/20"
                      >
                        <td className="p-4 font-crimson text-foreground max-w-xs">
                          {question.question}
                        </td>
                        <td className="p-4 font-crimson text-muted-foreground max-w-sm">
                          <div
                            className={`${
                              isCorrect ? "text-success" : "text-destructive"
                            }`}
                          >
                            {userAnswer}
                          </div>
                        </td>
                        <td className="p-4 font-crimson text-success max-w-sm">
                          {correctAnswer}
                        </td>
                        <td className="p-4 text-center">
                          <div
                            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border-2 ${
                              isCorrect
                                ? "border-success/50 bg-success/10 text-success"
                                : "border-destructive/50 bg-destructive/10 text-destructive"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="font-crimson font-medium">
                              {isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-crimson text-muted-foreground max-w-sm">
                          <div className="space-y-2">
                            {!isCorrect && userRationale && (
                              <div className="text-destructive/80 text-sm">
                                <strong>Your choice:</strong> {userRationale}
                              </div>
                            )}
                            <div className="text-success/80 text-sm">
                              <strong>Correct answer:</strong>{" "}
                              {correctAnswerInfo.rationale ||
                                "No explanation available"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <MedievalButton
              variant="parchment"
              onClick={() => navigate("/choose-challenge")}
            >
              New Quest
            </MedievalButton>
            <MedievalButton onClick={() => navigate("/library")}>
              Return to Library
            </MedievalButton>
            <MedievalButton variant="stone" onClick={() => navigate("/")}>
              Return Home
            </MedievalButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Summary;
