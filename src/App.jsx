import React from 'react';
import Reconciliation from './components/Reconciliation';

// Main App component
function App() {
  return (
    // Outer container for the entire application, ensuring it takes full height
    // and centers content, using Inter font and a light background.
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 font-inter antialiased text-gray-800">
      {/* Main title of the application */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-8 mt-4 text-center">
        Mini Reconciliation Tool
      </h1>
      {/* Render the Reconciliation component */}
      <Reconciliation />
    </div>
  );
}

export default App;
