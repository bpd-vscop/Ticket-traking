"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageEditor } from "@/components/ui/image-editor";
import { Camera, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fallbackInitials?: string;
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
  disabled = false,
  fallbackInitials,
}: ProfileImageUploadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

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
      // Open editor immediately; use an object URL for instant preview
      setIsEditorOpen(true);
      // Revoke previous object URL if any
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setTempImageSrc(url);
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
    // Revoke any object URL we created
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setTempImageSrc("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onImageChange("");
    setTempImageSrc("");
    setIsEditorOpen(false);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              src={currentImage && currentImage.trim() !== '' ? currentImage : undefined}
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
              {fallbackInitials && fallbackInitials.trim() !== '' ? (
                <span className="font-semibold">
                  {fallbackInitials}
                </span>
              ) : (
                <User className={iconSizes[size]} />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Remove image button (bottom-left) */}
          {!disabled && currentImage && currentImage.trim() !== '' && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
              className="absolute -bottom-2 -left-2 h-7 w-7 rounded-full shadow-md"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

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
