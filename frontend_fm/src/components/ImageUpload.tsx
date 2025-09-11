
import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string;
}

const ImageUpload = ({ onImageUpload, onSubmit, isLoading = false, error }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setFileName(file.name);
      onImageUpload(file);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setFileName('');
  };

  return (
    <section className="py-16 px-4" id="upload">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12 font-inter">
          Upload Your Furniture Image
        </h2>
        
        {!uploadedImage ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-peach bg-peach/10 scale-105'
                : 'border-gray-300 hover:border-lavender hover:bg-lavender/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
            
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-lavender to-peach rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10 text-gray-700" />
              </div>
              <div>
                <p className="text-xl font-medium text-gray-700 mb-2">
                  Drag and drop your image here
                </p>
                <p className="text-gray-500">
                  or <span className="text-peach font-medium">browse</span> to choose a file
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Supports: JPG, PNG, GIF (Max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              <img
                src={uploadedImage}
                alt="Uploaded furniture"
                className="w-full h-64 object-cover"
              />
              
              <div className="p-4 bg-gradient-to-r from-lavender/20 to-peach/20">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium truncate">{fileName}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl text-lg font-medium transition-all duration-300 ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-peach to-blush text-gray-800 hover:from-blush hover:to-peach transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Finding Matches...</span>
                </div>
              ) : (
                'Find Matching Furniture'
              )}
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImageUpload;
