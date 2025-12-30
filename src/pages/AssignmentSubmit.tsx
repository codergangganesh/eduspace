import { useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  X,
  File,
  Image,
  FileCode,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Mock assignment data - in real app, fetch from API
const assignmentData = {
  "1": {
    id: "1",
    title: "Algorithm Analysis Report",
    course: "Data Structures & Algorithms",
    courseCode: "CS201",
    instructor: "Prof. Michael Chen",
    dueDate: "Dec 26, 2024",
    dueTime: "11:59 PM",
    maxPoints: 100,
    description: "Analyze the time and space complexity of given algorithms. Your report should include Big-O notation analysis for at least 5 different algorithms covered in class.",
    requirements: [
      "Submit a PDF document with your analysis",
      "Include diagrams and graphs where applicable",
      "Minimum 1500 words",
      "Cite all references used",
    ],
    allowedFileTypes: [".pdf", ".doc", ".docx"],
    maxFileSize: 10, // MB
  },
  "2": {
    id: "2",
    title: "Database Design Project",
    course: "Database Management Systems",
    courseCode: "CS301",
    instructor: "Dr. James Wilson",
    dueDate: "Dec 28, 2024",
    dueTime: "5:00 PM",
    maxPoints: 150,
    description: "Design and implement a database schema for an e-commerce system. Include ER diagrams, normalized tables, and SQL scripts for creating the database.",
    requirements: [
      "ER diagram in PDF or image format",
      "SQL script file for database creation",
      "Documentation explaining design decisions",
      "At least 10 tables with proper relationships",
    ],
    allowedFileTypes: [".pdf", ".sql", ".zip", ".png", ".jpg"],
    maxFileSize: 25,
  },
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

const getFileIcon = (type: string) => {
  if (type.includes("image")) return Image;
  if (type.includes("pdf")) return FileText;
  if (type.includes("code") || type.includes("sql") || type.includes("zip")) return FileCode;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function AssignmentSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const assignment = assignmentData[id as keyof typeof assignmentData];

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="size-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Assignment Not Found</h1>
          <p className="text-muted-foreground mt-2">The assignment you're looking for doesn't exist.</p>
          <Link to="/assignments" className="mt-4">
            <Button>Back to Assignments</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Import the upload service dynamically or at top lvl (Added at top level in imports)
    // Assuming uploadToCloudinary is imported

    // Process uploads
    for (const fileObj of newFiles) {
      const file = Array.from(selectedFiles).find(f => f.name === fileObj.name);
      if (!file) continue;

      try {
        await uploadToCloudinary(file);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, progress: 100, status: "complete" } : f
          )
        );
      } catch (error) {
        console.error("Upload failed", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "error" } : f
          )
        );
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: "No files attached",
        description: "Please upload at least one file before submitting.",
        variant: "destructive",
      });
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "uploading");
    if (pendingFiles.length > 0) {
      toast({
        title: "Files still uploading",
        description: "Please wait for all files to finish uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Assignment Submitted!",
      description: "Your assignment has been submitted successfully.",
    });

    setIsSubmitting(false);
    navigate("/assignments");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to="/assignments">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {assignment.courseCode}
              </span>
              <span className="text-sm text-muted-foreground">{assignment.course}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{assignment.title}</h1>
            <p className="text-muted-foreground mt-1">Instructor: {assignment.instructor}</p>
          </div>
        </div>

        {/* Due Date Card */}
        <div className="bg-surface rounded-xl border border-border p-4 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground">Due Date</span>
              <p className="font-medium text-foreground">{assignment.dueDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground">Time</span>
              <p className="font-medium text-foreground">{assignment.dueTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground">Points</span>
              <p className="font-medium text-foreground">{assignment.maxPoints} pts</p>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">Assignment Details</h2>
          <p className="text-muted-foreground">{assignment.description}</p>

          <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Requirements:</h3>
          <ul className="space-y-2">
            {assignment.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" />
                <span>{req}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>Allowed: {assignment.allowedFileTypes.join(", ")}</span>
            <span>Max size: {assignment.maxFileSize} MB</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload Files</h2>

          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-secondary/50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={assignment.allowedFileTypes.join(",")}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.allowedFileTypes.join(", ")} up to {assignment.maxFileSize}MB
            </p>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      {file.status === "uploading" && (
                        <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {file.status === "complete" && (
                      <CheckCircle className="size-5 text-green-500 shrink-0" />
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="size-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Additional Comments</h2>
          <Textarea
            placeholder="Add any comments or notes for your instructor (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between gap-4 py-4">
          <Link to="/assignments">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assignment"
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
