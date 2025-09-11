
import { useState } from 'react';

interface FurnitureItem {
  id: string;
  name: string;
  image: string;
  price?: string;
  link?: string;
}

interface ResultsProps {
  uploadedImage: string;
  onUploadAnother: () => void;
}

const Results = ({ uploadedImage, onUploadAnother }: ResultsProps) => {
  // Mock data for furniture matches
  const mockResults: FurnitureItem[] = [
    {
      id: '1',
      name: 'Modern Minimalist Chair',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=400&fit=crop',
      price: '$299',
      link: '#'
    },
    {
      id: '2', 
      name: 'Scandinavian Oak Table',
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop',
      price: '$599',
      link: '#'
    },
    {
      id: '3',
      name: 'Cozy Reading Armchair',
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=400&fit=crop',
      price: '$449',
      link: '#'
    },
    {
      id: '4',
      name: 'Modern Bookshelf',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=400&fit=crop',
      price: '$329',
      link: '#'
    },
    {
      id: '5',
      name: 'Elegant Side Table',
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop',
      price: '$199',
      link: '#'
    },
    {
      id: '6',
      name: 'Contemporary Sofa',
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=400&fit=crop',
      price: '$899',
      link: '#'
    }
  ];

  return (
    <section className="py-16 px-4 bg-lightgray/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-inter">
            Perfect Matches Found!
          </h2>
          <p className="text-lg text-gray-600">
            Here are furniture pieces that match your uploaded image
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Uploaded Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 font-inter">
                Your Upload
              </h3>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Your uploaded furniture"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 bg-gradient-to-r from-lavender/20 to-peach/20">
                  <p className="text-gray-700 font-medium">Original Image</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 font-inter">
              Recommended Matches
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {mockResults.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-medium text-gray-800">
                        {item.price}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2 font-inter">
                      {item.name}
                    </h4>
                    <button className="w-full bg-gradient-to-r from-peach to-blush text-gray-800 py-2 px-4 rounded-lg font-medium hover:from-blush hover:to-peach transition-all duration-300 transform hover:scale-105">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Another Button */}
        <div className="text-center">
          <button
            onClick={onUploadAnother}
            className="bg-white text-gray-800 px-8 py-4 rounded-full text-lg font-medium border-2 border-lavender hover:bg-lavender transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Upload Another Image
          </button>
        </div>
      </div>
    </section>
  );
};

export default Results;
