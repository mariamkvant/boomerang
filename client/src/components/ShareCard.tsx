import React, { useState } from 'react';

interface ShareCardProps {
  title: string;
  description: string;
  points: number;
  category: string;
  categoryIcon: string;
  providerName: string;
  rating?: number;
  url: string;
}

export default function ShareCard({ title, description, points, category, categoryIcon, providerName, rating, url }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const shareText = `${categoryIcon} ${title} — ${points} 🪃 on Boomerang\n${description.slice(0, 100)}...\n\n${url}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} — Boomerang`, text: shareText, url });
        return;
      } catch {}
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button onClick={() => setShowCard(!showCard)} className="text-gray-400 hover:text-primary-500 p-1.5 rounded-lg hover:bg-gray-50" aria-label="Share">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {showCard && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 animate-fade-in overflow-hidden">
          {/* Preview card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{categoryIcon}</span>
              <span className="text-xs opacity-80">{category}</span>
              {rating && <span className="text-xs opacity-80 ml-auto">★ {Number(rating).toFixed(1)}</span>}
            </div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs opacity-80 line-clamp-2">{description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-bold">{points} 🪃</span>
              <span className="text-xs opacity-70">by {providerName}</span>
            </div>
          </div>
          <div className="p-3 flex gap-2">
            <button onClick={handleShare} className="flex-1 bg-primary-500 text-white py-2 rounded-xl text-xs font-medium hover:bg-primary-600">
              {copied ? '✓ Copied!' : 'Share'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600">WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  );
}
