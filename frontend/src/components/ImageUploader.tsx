import React, { useState } from 'react';

// Define an interface for the structure of a single search result
interface SearchResult {
  imageUrl: string;
  price: string; // Or number, depending on your backend
  buyLink: string;
}

function ImageUploader() {
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files as FileList);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadedImageFile(file);
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target && event.target.result) {
            setUploadedImagePreview(event.target.result.toString());
          }        };
        reader.readAsDataURL(file);

        uploadImageToBackend(file);
        console.log('Processed file:', file);

      } else {
        alert('Please upload an image file.');
      }
    }
  };

  const uploadImageToBackend = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/', { // TODO: Replace with your backend upload endpoint
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { results?: SearchResult[] } = await response.json();
      // Assuming backend returns an array of result objects, each with 'imageUrl', 'price', and 'buyLink'
      // Example data structure from backend:
      // { results: [ { imageUrl: '...', price: '...', buyLink: '...' }, ... ] } // Added type annotation
      if (data && data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
      } else {
        console.error("Unexpected backend response structure:", data);
        setSearchResults([]); // Set to empty array to avoid rendering issues
      }
      console.log('Search Results:', data);

    } catch (error) {
      console.error('Error uploading image:', error);
      // TODO: Implement user-friendly error display
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`image-uploader ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {uploadedImagePreview ? (
        <div className="uploaded-image-container">
          <img src={uploadedImagePreview} alt="Uploaded Furniture" className="uploaded-image" />
          <div className="search-results-container">
            <h2>Top 5 similar images</h2>
            {isLoading ? (
              <p>Searching for similar items...</p>
            ) : searchResults.length > 0 ? (
              <div className="results-grid">
                {searchResults.map((result, index) => (
                  <div key={index} className="result-item">
                    <img src={result.imageUrl} alt={`Similar furniture ${index + 1}`} className="result-image" />
                    <p className="result-price">{result.price}</p>
                    {result.buyLink && (
                      <a href={result.buyLink} target="_blank" rel="noopener noreferrer" className="buy-button">
                        Buy
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Optional: Display a message if no results are found after loading
              !isLoading && <p>No similar items found.</p>
            )}
            {/* Add a "Buy" button that doesn't really do anything for the uploaded image, or perhaps opens the upload modal again */}
            <div className="buy-button-container">
               <button className="buy-button">Buy</button> {/* Placeholder buy button for the uploaded image */}
            </div>

          </div>
        </div>
      ) : (
        <div className="upload-area">
          <p>Drag & drop an image of furniture here, or click to select one.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="file-input"
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;