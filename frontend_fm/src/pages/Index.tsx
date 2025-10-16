import { useState } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ImageUpload from '../components/ImageUpload';
import Results from '../components/Results';
import Footer from '../components/Footer';

// ---- קריאת API לבקאנד (FastAPI) ----
async function matchFurniture(file: File) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${base}/match`;           // לפי /docs: POST /match
    const fd = new FormData();
    fd.append('file', file);                // לפי /docs: שם הפרמטר הוא "file"

    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();                      // מצפה ל-JSON
}

// ---- טיפוס פנימי לתוצאה שמוצגת ברשימת ה-Results ----
type ResultItem = {
    id?: string | number;
    title?: string;
    image?: string | null;
    price?: string | number | null;
    link?: string | null;
    score?: number | null;
};

// ממפה את תגובת הבקאנד לרשימה שטוחה של כרטיסים לתצוגה
function normalizeResults(data: any): ResultItem[] {
    // מבנה השרת: { status, results: [ {label, conf, box, matches: [ { image_path, abs_path, score, meta:{...} }, ... ]}, ... ] }
    const detections = data?.results;
    if (Array.isArray(detections)) {
        const flat: ResultItem[] = detections.flatMap((det: any) =>
            (det?.matches ?? []).map((m: any, i: number) => ({
                id: m?.meta?.id ?? `${det?.label ?? 'match'}-${i}`,
                title: m?.meta?.style ?? m?.meta?.category ?? det?.label ?? 'Match',
                // חשוב: מציגים את URL המקורי מה-DB (frontend לא יכול לפתוח path מקומי של השרת)
                image: m?.meta?.image_url ?? null,
                price: m?.meta?.price ?? null,
                link: m?.meta?.external_url ?? m?.meta?.pinterest_url ?? null,
                score: typeof m?.score === 'number' ? m.score : null,
            }))
        );

        // אם אין matches, נחזיר ריק (ואז יופיע "No matches found.")
        return flat;
    }

    // fallback: אם השרת כבר מחזיר מערך "שטוח"
    if (Array.isArray(data)) return data as ResultItem[];

    return [];
}

const Index = () => {
    const [currentView, setCurrentView] = useState<'home' | 'upload' | 'results'>('home');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [results, setResults] = useState<ResultItem[]>([]);

    const handleGetStarted = () => {
        setCurrentView('upload');
        setTimeout(() => {
            document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleImageUpload = (file: File) => {
        // ולידציות בסיס:
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError('');
        setUploadedFile(file);

        // תצוגת תצ"א
        const reader = new FileReader();
        reader.onload = (e) => setUploadedImageUrl(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!uploadedFile) {
            setError('Please upload an image first');
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const data = await matchFurniture(uploadedFile);
            const flat = normalizeResults(data);
            setResults(flat);
            setCurrentView('results');
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Failed to process image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadAnother = () => {
        setCurrentView('home');
        setUploadedFile(null);
        setUploadedImageUrl('');
        setResults([]);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-inter">
            {currentView === 'results' ? (
                <Results
                    uploadedImage={uploadedImageUrl}
                    onUploadAnother={handleUploadAnother}
                    results={results}     // ← מעבירים לרכיב התוצאות
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
