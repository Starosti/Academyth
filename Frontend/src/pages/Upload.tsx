import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MedievalButton } from "@/components/ui/medieval-button";

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setSuccess(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);

    // For now, we'll just upload the first file.
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "File upload failed");
      }

      const data = await response.json();

      // Show success message
      setSuccess(`File "${data.originalFilename}" uploaded successfully!`);

      // Clear the files
      setFiles([]);

      // Navigate to choose challenge with the document ID after a short delay
      setTimeout(() => {
        navigate("/choose-challenge", {
          state: { scrollId: data.documentId },
        });
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">
              Upload Your Scrolls
            </h1>
            <p className="text-lg font-crimson text-muted-foreground max-w-2xl mx-auto">
              Prepare your knowledge for the dragon's challenge. Upload your
              study materials to generate questions for the battle.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-card/50 border-2 border-dashed border-border/50 rounded-lg p-12 text-center backdrop-blur-sm shadow-medieval">
            <div
              className={`transition-all duration-300 ${
                dragActive ? "border-primary/50 bg-primary/5" : ""
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadIcon className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-cinzel font-semibold mb-4 text-foreground">
                Drag and drop your scrolls here
              </h3>
              <p className="text-muted-foreground font-crimson mb-6">Or</p>

              <label htmlFor="file-upload">
                <MedievalButton
                  variant="parchment"
                  className="cursor-pointer"
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0 || success !== null}
                >
                  {uploading
                    ? "Uploading..."
                    : success
                    ? "Upload Complete!"
                    : "Upload & Continue"}
                </MedievalButton>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  disabled={success !== null}
                  style={
                    files.length < 1 && !success
                      ? {
                          cursor: "pointer",
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          top: 0,
                          left: 0,
                          opacity: 0,
                        }
                      : { display: "none" }
                  }
                />
              </label>
            </div>
          </div>

          {/* File Type Info */}
          <div className="mt-6 text-center">
            <p className="text-sm font-crimson text-muted-foreground">
              Supported formats: PDF, DOCX, TXT. Max file size: 10MB
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mt-6 bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                <p className="font-crimson text-green-400">{success}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-crimson text-green-300 mb-3">
                  Redirecting to challenge selection...
                </p>
                <MedievalButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/library")}
                >
                  Go to Library Instead
                </MedievalButton>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-destructive/20 border border-destructive text-destructive-foreground p-4 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              <p className="font-crimson">{error}</p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-cinzel font-semibold mb-4 text-foreground">
                Selected Scrolls
              </h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/20 border border-border/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="font-crimson">
                        <p className="font-semibold text-foreground">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <MedievalButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading || success !== null}
                    >
                      Remove
                    </MedievalButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Upload;
