import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-full animate-pulse">
      {/* Image placeholder */}
      <div className="h-60 bg-gray-200"></div>
      
      {/* Content placeholder */}
      <div className="p-5">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Description */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        
        {/* Price and stock */}
        <div className="flex justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2 mt-3">
          <div className="h-10 bg-gray-200 rounded flex-grow"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};
