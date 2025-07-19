import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { MedievalButton } from '@/components/ui/medieval-button';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    // Simulate upload process
    setTimeout(() => {
      navigate('/choose-challenge');
    }, 1500);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel font-bold mb-4 text-primary">Upload Your Scrolls</h1>
            <p className="text-lg font-crimson text-muted-foreground max-w-2xl mx-auto">
              Prepare your knowledge for the dragon's challenge. Upload your study materials to generate questions for the battle.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-card/50 border-2 border-dashed border-border/50 rounded-lg p-12 text-center backdrop-blur-sm shadow-medieval">
            <div 
              className={`transition-all duration-300 ${dragActive ? 'border-primary/50 bg-primary/5' : ''}`}
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
                <MedievalButton variant="parchment" className="cursor-pointer">
                  Browse Files
                </MedievalButton>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
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

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-cinzel font-semibold mb-4 text-foreground">Selected Scrolls</h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/20 border border-border/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-crimson font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <MedievalButton onClick={handleUpload} size="lg">
                  Prepare for Battle
                </MedievalButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Upload;