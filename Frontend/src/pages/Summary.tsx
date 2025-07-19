import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Clock, Target, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";

interface SummaryState {
  answers: number[];
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  playerHP: number;
  dragonHP: number;
}

const Summary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SummaryState;

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

  const correctAnswers = answers.filter(
    (answer, index) => answer === questions[index].correctAnswer
  ).length;
  const accuracy = Math.round((correctAnswers / questions.length) * 100);
  const timeSpent = "35 min"; // Simulated

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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
              <p className="font-crimson text-muted-foreground leading-relaxed mb-6">
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
                      Answer
                    </th>
                    <th className="text-center p-4 font-cinzel font-semibold text-muted-foreground">
                      Result
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

                    return (
                      <tr
                        key={question.id}
                        className="border-b border-border/20"
                      >
                        <td className="p-4 font-crimson text-foreground max-w-xs">
                          {question.question}
                        </td>
                        <td className="p-4 font-crimson text-muted-foreground">
                          {userAnswer}
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
