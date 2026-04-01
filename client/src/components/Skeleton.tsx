import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-card animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-full bg-gray-100 rounded mb-1"></div>
      <div className="h-4 w-2/3 bg-gray-100 rounded mb-4"></div>
      <div className="flex justify-between pt-3 border-t border-gray-50">
        <div className="h-5 w-24 bg-gray-200 rounded"></div>
        <div className="h-5 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-card animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
