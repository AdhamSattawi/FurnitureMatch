
import { Upload } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative py-20 px-4 text-center animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 font-inter">
          Furniture
          <span className="text-transparent bg-gradient-to-r from-lavender to-blush bg-clip-text">
            Match
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
          Find Furniture that Fits Perfectly
        </p>
        
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Upload an image of your favorite furniture piece and discover similar items 
          that match your style and space perfectly.
        </p>
        
        <button
          onClick={onGetStarted}
          className="group bg-gradient-to-r from-peach to-blush text-gray-800 px-8 py-4 rounded-full text-lg font-medium hover:from-blush hover:to-peach transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Upload className="w-5 h-5 inline-block mr-2 group-hover:animate-bounce" />
          Get Started
        </button>
      </div>
    </section>
  );
};

export default Hero;
