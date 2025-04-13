
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onFileUrlChange: (url: string | null) => void;
  initialFileUrl?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  onFileUrlChange,
  initialFileUrl = null,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(initialFileUrl);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Unsupported file type. Please upload an image, video, or PDF.');
      return;
    }
    
    setUploadedFile(file);
    onFileChange(file);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string || null;
        setFilePreview(preview);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-images, just show the file name
      setFilePreview(null);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    onFileChange(null);
    onFileUrlChange(null);
  };

  return (
    <div className="space-y-4">
      <div>
        {!uploadedFile && !filePreview ? (
          <div className="border border-dashed border-border/70 rounded-md p-6 text-center bg-crypto-dark/50">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Upload an image, video, or document</p>
            <label className="relative cursor-pointer">
              <Button variant="secondary" type="button" className="relative z-10">
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                accept="image/*,video/*,application/pdf"
              />
            </label>
          </div>
        ) : (
          <div className="border border-border/70 rounded-md p-4 bg-crypto-dark/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground mr-2" />
                <p className="text-sm font-medium truncate">
                  {uploadedFile?.name || "Uploaded File"}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                type="button"
                onClick={handleRemoveFile}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            
            {filePreview && filePreview.startsWith('data:image/') && (
              <div className="mt-2">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="rounded-md max-h-40 mx-auto"
                />
              </div>
            )}
            
            {isUploading && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                Uploading...
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Supported formats: JPEG, PNG, GIF, MP4, PDF. Maximum size: 10MB.
      </p>
    </div>
  );
};

export default FileUpload;
