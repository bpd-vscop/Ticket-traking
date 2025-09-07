"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageEditor } from "@/components/ui/image-editor";
import { Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24", 
  lg: "w-32 h-32"
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6"
};

export function ProfileImageUpload({
  currentImage,
  onImageChange,
  className,
  size = "lg",
  disabled = false
}: ProfileImageUploadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setTempImageSrc(e.target.result);
          setIsEditorOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading image file:', error);
      alert('Error reading image file. Please try again.');
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleSaveCroppedImage = (croppedImageUrl: string) => {
    onImageChange(croppedImageUrl);
    setIsEditorOpen(false);
    setTempImageSrc("");
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setTempImageSrc("");
  };

  return (
    <>
      <div className={cn("relative inline-block", className)}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={disabled}
        />
        
        <div
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            sizeClasses[size],
            disabled && "cursor-not-allowed opacity-50"
          )}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => !disabled && setIsHovered(false)}
          onClick={handleClick}
        >
          <Avatar className={cn(
            "w-full h-full border-2 border-muted transition-all duration-200", 
            isHovered && !disabled && "border-primary/50"
          )}>
            <AvatarImage 
              src={currentImage} 
              alt="Profile picture" 
              className={cn(
                "transition-all duration-200 object-cover", 
                isHovered && !disabled && "brightness-50"
              )}
            />
            <AvatarFallback className={cn(
              "bg-muted transition-all duration-200", 
              isHovered && !disabled && "bg-muted/80"
            )}>
              <User className={iconSizes[size]} />
            </AvatarFallback>
          </Avatar>

          {/* Hover overlay */}
          {isHovered && !disabled && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-all duration-200">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full p-2 h-auto"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Editor Modal */}
      <ImageEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        imageSrc={tempImageSrc}
        onSave={handleSaveCroppedImage}
        aspectRatio={1} // Square crop for profile pictures
      />
    </>
  );
}