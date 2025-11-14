import React, { useRef } from 'react';
import type { OverlayData } from '../types';
import Input from './Input';

interface OverlayControlProps {
  overlay: OverlayData;
  onFileChange: (file: File | null) => void;
  onPropChange: (field: 'x' | 'y' | 'scale', value: string) => void;
  disabled?: boolean;
}

const OverlayControl: React.FC<OverlayControlProps> = ({ overlay, onFileChange, onPropChange, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };
  
  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleUploadClick on the parent
    onFileChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/webp"
        disabled={disabled}
      />
      <div
        onClick={handleUploadClick}
        className={`w-24 h-24 flex-shrink-0 border-2 border-dashed rounded-md flex items-center justify-center transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-indigo-500'} ${overlay.preview ? 'p-1' : ''}`}
      >
        {overlay.preview ? (
           <div className="relative group w-full h-full">
            <img src={overlay.preview} alt="Overlay preview" className="w-full h-full object-contain rounded-sm" />
             <div 
              onClick={handleRemoveImage} 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold cursor-pointer text-xs"
            >
              &times;
            </div>
           </div>
        ) : (
          <div className="text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-xs text-gray-500 mt-1">Add PNG</p>
          </div>
        )}
      </div>

      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
         <Input label="X Position (%)" type="number" id={`x-${overlay.id}`} value={overlay.x} onChange={e => onPropChange('x', e.target.value)} disabled={disabled || !overlay.file} />
         <Input label="Y Position (%)" type="number" id={`y-${overlay.id}`} value={overlay.y} onChange={e => onPropChange('y', e.target.value)} disabled={disabled || !overlay.file} />
         <Input label="Scale (%)" type="number" id={`scale-${overlay.id}`} value={overlay.scale} onChange={e => onPropChange('scale', e.target.value)} disabled={disabled || !overlay.file} />
      </div>
    </div>
  );
};

export default OverlayControl;
