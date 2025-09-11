
import { useState } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ImageUpload from '../components/ImageUpload';
import Results from '../components/Results';
import Footer from '../components/Footer';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'results'>('home');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGetStarted = () => {
    setCurrentView('upload');
    // Smooth scroll to upload section
    setTimeout(() => {
      document.getElementById('upload')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const handleImageUpload = (file: File) => {
    console.log('Image uploaded:', file.name);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setError('');
    setUploadedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Processing image for furniture matching...');
      setCurrentView('results');
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Error processing image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAnother = () => {
    setCurrentView('home');
    setUploadedFile(null);
    setUploadedImageUrl('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {currentView === 'results' ? (
        <Results 
          uploadedImage={uploadedImageUrl}
          onUploadAnother={handleUploadAnother}
        />
      ) : (
        <>
          <Hero onGetStarted={handleGetStarted} />
          <HowItWorks />
          <ImageUpload 
            onImageUpload={handleImageUpload}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
