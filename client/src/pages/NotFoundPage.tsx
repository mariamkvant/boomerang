import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 pb-24 md:pb-8 animate-fade-in">
      <div className="text-6xl mb-4">🪃</div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">This boomerang didn't come back. The page you're looking for doesn't exist.</p>
      <div className="flex gap-3">
        <Link to="/" className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600">Go Home</Link>
        <Link to="/browse" className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">Browse Services</Link>
      </div>
    </div>
  );
}
