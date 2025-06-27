import React from 'react';
import Reconciliation from './components/Reconciliation';

// Main App component
function App() {
  return (
    // Outer container for the entire application, ensuring it takes full height,
    // centers content, uses Inter font, and has the new light green background.
    <div className="min-h-screen flex flex-col items-center p-0 bg-emerald-50 font-inter antialiased text-gray-800">
      {/* Prominent Header Section */}
      <header className="w-full bg-gray-900 text-white py-6 md:py-8 shadow-xl mb-8 flex flex-col justify-center items-center">
        {/* Main title of the application */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center tracking-wide leading-tight mb-2">
          Mini Reconciliation Tool
        </h1>
        {/* New description below the title */}
        <p className="text-white text-lg md:text-xl font-light text-center max-w-2xl px-4">
          Effortlessly compare transactions between your internal system and payment provider statements to highlight discrepancies.
        </p>
      </header>

      {/* Main content area, separated from the header */}
      <main className="w-full max-w-4xl px-4 pb-8">
        <Reconciliation />
      </main>
    </div>
  );
}

export default App;
