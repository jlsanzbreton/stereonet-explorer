import React from 'react';

const TopNav: React.FC = () => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 011.414-1.414zm10 0l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z"
        />
      </svg>
      <h1 className="text-2xl font-bold text-gray-700">Stereonet Explorer</h1>
    </div>
  </header>
);

export default TopNav;
