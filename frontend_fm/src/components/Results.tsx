import React from "react";

type ResultItem = {
    id?: string | number;
    title?: string;
    image?: string | null;
    price?: string | number | null;
    link?: string | null;
    score?: number | null; // מצטיין אם מגיע מהשרת
};

interface ResultsProps {
    uploadedImage: string;
    onUploadAnother: () => void;
    results?: ResultItem[];
}

const Results: React.FC<ResultsProps> = ({ uploadedImage, onUploadAnother, results = [] }) => {
    const hasResults = Array.isArray(results) && results.length > 0;

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
                                {uploadedImage && (
                                    <img
                                        src={uploadedImage}
                                        alt="Your uploaded furniture"
                                        className="w-full h-64 object-cover"
                                    />
                                )}
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

                        {!hasResults ? (
                            <div className="text-gray-500 bg-white rounded-2xl shadow p-8">
                                No matches found.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {results.map((item, index) => {
                                    const title = item.title ?? "Untitled";
                                    const img = item.image ?? undefined;
                                    const price =
                                        item.price == null
                                            ? undefined
                                            : typeof item.price === "number"
                                                ? `$${item.price}`
                                                : item.price;

                                    return (
                                        <div
                                            key={String(item.id ?? index)}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scale-in"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="relative overflow-hidden">
                                                {img && (
                                                    <img
                                                        src={img}
                                                        alt={title}
                                                        className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                                                    />
                                                )}
                                                {(price || item.score != null) && (
                                                    <div className="absolute top-4 right-4 space-y-2 flex flex-col items-end">
                                                        {price && (
                                                            <span className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-800">
                                                                {price}
                                                            </span>
                                                        )}
                                                        {typeof item.score === "number" && (
                                                            <span className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-700">
                                                                score: {item.score.toFixed(3)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-6">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-3 font-inter">
                                                    {title}
                                                </h4>

                                                <button
                                                    className="w-full bg-gradient-to-r from-peach to-blush text-gray-800 py-2 px-4 rounded-lg font-medium hover:from-blush hover:to-peach transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                                                    onClick={() => item.link && window.open(item.link, "_blank", "noopener,noreferrer")}
                                                    disabled={!item.link}
                                                    title={item.link ? "Open product page" : "No external link"}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
