"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crop as CropIcon, RotateCcw, Check, X } from "lucide-react";
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (croppedImageUrl: string) => void;
  aspectRatio?: number;
}

export function ImageEditor({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onSave, 
  aspectRatio = 1 // Square crop by default for profile pictures
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // No visible preview canvas; we render to an offscreen canvas when saving

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Set initial crop to a centered square at ~90% of the smallest side,
    // so the crop area is clearly visible and adjustable.
    const base = Math.min(width, height);
    const size = Math.round(base * 0.9);
    const x = Math.round((width - size) / 2);
    const y = Math.round((height - size) / 2);

    const init = {
      unit: 'px' as const,
      width: size,
      height: size,
      x,
      y,
    };
    setCrop(init);
    setCompletedCrop({ x, y, width: size, height: size });
  }, []);

  const getCroppedImg = useCallback(async (): Promise<string> => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      throw new Error('Canvas or image not found');
    }

    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to desired output size (square for profile picture)
    const outputSize = 300; // 300x300px output
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate scale factors
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Canvas is empty');
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop]);

  const handleSave = async () => {
    // completedCrop is set on image load; guard on image presence as well
    if (!imgRef.current || !completedCrop) return;

    setIsLoading(true);
    try {
      const croppedImageUrl = await getCroppedImg();
      onSave(croppedImageUrl);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const size = Math.min(width, height);
      const x = (width - size) / 2;
      const y = (height - size) / 2;
      
      setCrop({
        unit: 'px',
        width: size,
        height: size,
        x,
        y,
      });
      setCompletedCrop({ x, y, width: size, height: size });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative max-w-full max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={true}
              ruleOfThirds={true}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain'
                }}
              />
            </ReactCrop>
          </div>
          {/* Preview removed per request */}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!completedCrop || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
