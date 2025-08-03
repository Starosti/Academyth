import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  HardDrive,
  Play,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";

interface Scroll {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  lastUsed: string;
  fileType?: string;
}

interface Quest {
  id: string;
  title: string;
  difficulty: string;
  score: number;
  date: string;
  scrollUsed: string;
}

const Library: React.FC = () => {
  const navigate = useNavigate();
  const [scrolls, setScrolls] = useState<Scroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // API base URL
  const API_BASE_URL = "http://localhost:5000";

  // Fetch all documents from the API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/documents`);

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setScrolls(data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load your scrolls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a document
  const handleDeleteScroll = async (scrollId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this scroll? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingId(scrollId);

      const response = await fetch(`${API_BASE_URL}/document/${scrollId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      // Remove the document from local state
      setScrolls((prevScrolls) =>
        prevScrolls.filter((scroll) => scroll.id !== scrollId)
      );
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("Failed to delete the scroll. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">
              Your Library
            </h1>
            <p className="text-lg font-crimson text-muted-foreground">
              Manage your uploaded scrolls and review your legendary quests and
              victories.
            </p>
          </div>

          <div className="grid  gap-12">
            {/* Scrolls Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-cinzel font-bold text-foreground">
                  Your Scrolls
                </h2>
                <div className="flex items-center space-x-2">
                  <MedievalButton
                    variant="ghost"
                    onClick={fetchDocuments}
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </MedievalButton>
                  <MedievalButton
                    variant="parchment"
                    onClick={() => navigate("/upload")}
                    size="sm"
                  >
                    Upload New
                  </MedievalButton>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-red-400 font-crimson">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="font-crimson text-muted-foreground">
                    Loading your scrolls...
                  </p>
                </div>
              )}

              {/* Scrolls List */}
              {!loading && (
                <div className="space-y-4">
                  {scrolls.map((scroll) => (
                    <div
                      key={scroll.id}
                      className="bg-card/50 border border-border/30 rounded-lg p-6 backdrop-blur-sm shadow-medieval hover:shadow-gold-glow transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-muted/20 border border-border/30 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-cinzel font-semibold text-foreground mb-2">
                              {scroll.name}
                            </h3>
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
                              {scroll.fileType === "application/pdf"
                                ? "PDF Document"
                                : scroll.fileType ===
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                ? "Word Document"
                                : "Document"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MedievalButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate("/choose-challenge", {
                                state: { scrollId: scroll.id },
                              })
                            }
                          >
                            <Play className="h-4 w-4" />
                          </MedievalButton>
                          <MedievalButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteScroll(scroll.id)}
                            disabled={deletingId === scroll.id}
                          >
                            {deletingId === scroll.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </MedievalButton>
                        </div>
                      </div>
                    </div>
                  ))}

                  {scrolls.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-cinzel font-semibold text-muted-foreground mb-2">
                        No Scrolls Yet
                      </h3>
                      <p className="font-crimson text-muted-foreground mb-6">
                        Upload your first scroll to begin your journey.
                      </p>
                      <MedievalButton onClick={() => navigate("/upload")}>
                        Upload Scroll
                      </MedievalButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Library;
