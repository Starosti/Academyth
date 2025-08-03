import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Sword, Flame, AlertCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";

interface DifficultyLevel {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  details: string;
}

const difficultyLevels: DifficultyLevel[] = [
  {
    id: "easy",
    name: "Easy",
    icon: Shield,
    description: "A gentle introduction to the quest",
    details:
      "A gentle introduction to the quest, with simpler questions and a less formidable dragon.",
  },
  {
    id: "medium",
    name: "Medium",
    icon: Sword,
    description: "A balanced challenge for your knowledge",
    details:
      "A balanced challenge, testing your knowledge with moderately difficult questions and a stronger dragon.",
  },
  {
    id: "hard",
    name: "Hard",
    icon: Flame,
    description: "The ultimate test of your skills",
    details:
      "The ultimate test of your skills, featuring complex questions and a powerful dragon.",
  },
];

const ChooseChallenge: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollId } = location.state || {};
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [loadingDocInfo, setLoadingDocInfo] = useState(true);

  // Fetch document info on component mount
  useEffect(() => {
    const fetchDocumentInfo = async () => {
      if (!scrollId) {
        setLoadingDocInfo(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/document/${scrollId}`
        );
        if (response.ok) {
          const docInfo = await response.json();
          setDocumentName(docInfo.originalFilename || "Unknown Document");
        }
      } catch (err) {
        console.error("Error fetching document info:", err);
      } finally {
        setLoadingDocInfo(false);
      }
    };

    fetchDocumentInfo();
  }, [scrollId]);

  const handleBeginQuest = async () => {
    if (!scrollId) {
      setError("Document ID is missing. Please go back and select a document.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: scrollId,
          difficulty: selectedDifficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const questions = await response.json();

      if (!questions || questions.length === 0) {
        throw new Error(
          "The generated quiz is empty. The document might not have enough content."
        );
      }

      navigate("/battle", {
        state: { questions, difficulty: selectedDifficulty, scrollId },
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while generating the quiz.");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">
              Choose Your Challenge
            </h1>
            <p className="text-lg font-crimson text-muted-foreground max-w-2xl mx-auto">
              Your scroll{" "}
              <span className="font-bold text-primary/90">
                {loadingDocInfo
                  ? "Loading..."
                  : documentName ||
                    (scrollId
                      ? `Document ${scrollId.substring(0, 8)}...`
                      : "is ready")}
              </span>
              . Select the difficulty for your dragon battle.
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
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                  onClick={() => setSelectedDifficulty(level.id)}
                >
                  <div
                    className={`bg-card/50 border-2 rounded-lg p-6 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow transition-all duration-300 ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/30 hover:border-border/60"
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div
                        className={`p-4 rounded-full mx-auto w-fit ${
                          isSelected ? "bg-primary/20" : "bg-muted/20"
                        } border border-border/30`}
                      >
                        <Icon
                          className={`h-8 w-8 ${
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
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

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-destructive/20 border border-destructive text-destructive-foreground p-4 rounded-lg flex items-center justify-center max-w-2xl mx-auto">
              <AlertCircle className="h-5 w-5 mr-3" />
              <p className="font-crimson">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center">
            <MedievalButton
              size="lg"
              variant="default"
              onClick={handleBeginQuest}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Quest...
                </>
              ) : (
                "Begin Your Quest"
              )}
            </MedievalButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChooseChallenge;
