import React, { useState } from 'react';
// PapaParse is loaded via CDN in index.html and is available globally as 'window.Papa'.
// Therefore, no direct import is needed here.

// Reconciliation component for handling CSV uploads and data reconciliation
function Reconciliation() {
  const [internalData, setInternalData] = useState([]); // State to store internal CSV data
  const [providerData, setProviderData] = useState([]); // State to store provider CSV data
  const [results, setResults] = useState(null); // State to store reconciliation results
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const [message, setMessage] = useState(''); // State for displaying messages to the user

  // States to manage file names and drag-over effects for UI feedback
  const [internalFileName, setInternalFileName] = useState(null);
  const [providerFileName, setProviderFileName] = useState(null);
  const [internalDragOver, setInternalDragOver] = useState(false);
  const [providerDragOver, setProviderDragOver] = useState(false);

  // Helper function to set file name based on setter
  const setFileNameState = (setter, fileName) => {
    if (setter === setInternalData) setInternalFileName(fileName);
    if (setter === setProviderData) setProviderFileName(fileName);
  };

  // Function to handle file uploads (from input or drag-and-drop) and parse CSV data
  const handleFileUpload = (file, setter) => {
    if (file) {
      setIsLoading(true); // Show loading indicator
      setMessage(`Loading ${file.name}...`); // Update message to user
      setFileNameState(setter, file.name); // Set the file name immediately for display

      // Ensure PapaParse is available globally before using it
      if (window.Papa) {
        window.Papa.parse(file, {
          header: true, // Treat the first row as headers
          skipEmptyLines: true, // Ignore empty rows
          complete: (result) => {
            setter(result.data); // Set the parsed data to the respective state
            setIsLoading(false); // Hide loading indicator
            setMessage(`${file.name} loaded successfully.`); // Success message
          },
          error: (error) => {
            setIsLoading(false); // Hide loading indicator
            setMessage(`Error parsing ${file.name}: ${error.message}`); // Error message
            setFileNameState(setter, null); // Clear file name on error
          }
        });
      } else {
        // Fallback if PapaParse CDN fails to load
        setIsLoading(false);
        setMessage('Error: PapaParse library not loaded. Please check your internet connection or index.html.');
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default to allow drop
    e.stopPropagation(); // Stop propagation
    e.dataTransfer.dropEffect = 'copy'; // Visual feedback for copy
  };

  const handleDragEnter = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    if (setter === setInternalData) setInternalDragOver(true);
    if (setter === setProviderData) setProviderDragOver(true);
  };

  const handleDragLeave = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    if (setter === setInternalData) setInternalDragOver(false);
    if (setter === setProviderData) setProviderDragOver(false);
  };

  const handleDrop = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    if (setter === setInternalData) setInternalDragOver(false);
    if (setter === setProviderData) setProviderDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], setter);
    }
  };

  // Function to clear a selected file
  const handleClearFile = (setter) => {
    if (setter === setInternalData) {
      setInternalData([]);
      setInternalFileName(null);
    }
    if (setter === setProviderData) {
      setProviderData([]);
      setProviderFileName(null);
    }
    setResults(null); // Clear results if files are cleared
    setMessage('File cleared. Please upload new files to reconcile.');
  };

  // Function to perform the reconciliation logic
  const reconcile = () => {
    if (internalData.length === 0 || providerData.length === 0) {
      setMessage('Please upload both Internal and Provider CSV files to reconcile.');
      return;
    }
    setMessage('Reconciling data...');
    setIsLoading(true);

    // Create Maps for efficient lookup by transaction_reference
    const internalMap = new Map(internalData.map(tx => [tx.transaction_reference, tx]));
    const providerMap = new Map(providerData.map(tx => [tx.transaction_reference, tx]));

    const matched = []; // Array for matched transactions
    const onlyInternal = []; // Array for transactions only in internal data
    const onlyProvider = []; // Array for transactions only in provider data

    // Iterate through internal data to find matches and internal-only transactions
    internalMap.forEach((intTx, ref) => {
      if (providerMap.has(ref)) {
        const provTx = providerMap.get(ref);
        matched.push({
          ...intTx, // Include all fields from internal transaction
          matched_amount: intTx.amount === provTx.amount, // Check if amounts match
          matched_status: intTx.status === provTx.status, // Check if statuses match
          provider_amount: provTx.amount, // Provider's amount
          provider_status: provTx.status // Provider's status
        });
      } else {
        onlyInternal.push(intTx); // Transaction only found in internal data
      }
    });

    // Iterate through provider data to find provider-only transactions
    providerMap.forEach((provTx, ref) => {
      if (!internalMap.has(ref)) {
        onlyProvider.push(provTx); // Transaction only found in provider data
      }
    });

    // Set the reconciliation results
    setResults({ matched, onlyInternal, onlyProvider });
    setIsLoading(false);
    setMessage('Reconciliation complete!');
  };

  // Function to export data to a CSV file
  const exportCSV = (data, filename) => {
    if (data.length === 0) {
      setMessage(`No data to export for ${filename}.`);
      return;
    }
    // Ensure PapaParse is available globally before using it for unparsing
    if (window.Papa) {
      const csv = window.Papa.unparse(data); // Unparse JSON data to CSV string
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); // Create a Blob
      const link = document.createElement('a'); // Create a temporary anchor element
      link.href = URL.createObjectURL(blob); // Set href to Blob URL
      link.setAttribute('download', filename); // Set download filename
      document.body.appendChild(link); // Append link to body (required for Firefox)
      link.click(); // Programmatically click the link to trigger download
      document.body.removeChild(link); // Clean up the temporary link
      setMessage(`Exported ${filename} successfully.`);
    } else {
      // Fallback if PapaParse CDN fails to load
      setMessage('Error: PapaParse library not loaded. Cannot export CSV.');
    }
  };

  return (
    // Main container for the reconciliation tool itself, now a rounded white card with shadow
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col items-center">
      {/* Upload section */}
      <div className="upload-section flex flex-col md:flex-row justify-center items-stretch gap-6 mb-8 w-full">
        {/* Internal CSV upload input / Drag-and-Drop Area */}
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer min-h-[140px] text-center
                     ${internalDragOver ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-gray-200 bg-white text-gray-600 shadow-sm'}
                     transition-all duration-200 ease-in-out hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, setInternalData)}
          onDragLeave={(e) => handleDragLeave(e, setInternalData)}
          onDrop={(e) => handleDrop(e, setInternalData)}
        >
          <input
            id="internal-file-upload" // Added ID for better label association
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e.target.files[0], setInternalData)}
            className="hidden" // Hide default file input
          />
          <label htmlFor="internal-file-upload" className="cursor-pointer text-lg font-medium">
            {internalFileName ? (
              <span className="flex flex-col items-center text-gray-900">
                <span className="text-xl text-emerald-600 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                File Loaded: <span className="font-semibold text-emerald-700">{internalFileName}</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearFile(setInternalData); }}
                  className="mt-2 px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                >
                  Clear
                </button>
              </span>
            ) : (
              <span className="flex flex-col items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                 </svg>
                Drag & drop or <span className="text-emerald-600 underline font-semibold">click to upload</span> Internal CSV
              </span>
            )}
          </label>
          <p className="text-sm text-gray-500 mt-1">(.csv files only)</p>
        </div>

        {/* Provider CSV upload input / Drag-and-Drop Area */}
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer min-h-[140px] text-center
                     ${providerDragOver ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-gray-200 bg-white text-gray-600 shadow-sm'}
                     transition-all duration-200 ease-in-out hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, setProviderData)}
          onDragLeave={(e) => handleDragLeave(e, setProviderData)}
          onDrop={(e) => handleDrop(e, setProviderData)}
        >
          <input
            id="provider-file-upload" // Added ID for better label association
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e.target.files[0], setProviderData)}
            className="hidden" // Hide default file input
          />
          <label htmlFor="provider-file-upload" className="cursor-pointer text-lg font-medium">
            {providerFileName ? (
              <span className="flex flex-col items-center text-gray-900">
                 <span className="text-xl text-emerald-600 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                File Loaded: <span className="font-semibold text-emerald-700">{providerFileName}</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearFile(setProviderData); }}
                  className="mt-2 px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                >
                  Clear
                </button>
              </span>
            ) : (
              <span className="flex flex-col items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                 </svg>
                Drag & drop or <span className="text-emerald-600 underline font-semibold">click to upload</span> Provider CSV
              </span>
            )}
          </label>
          <p className="text-sm text-gray-500 mt-1">(.csv files only)</p>
        </div>
      </div>

      {/* Reconcile button */}
      <button
        onClick={reconcile}
        className={`px-10 py-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-md mb-8
                   hover:bg-emerald-700 transition duration-200 ease-in-out transform hover:scale-105
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75 w-full md:w-auto
                   ${(isLoading || !internalFileName || !providerFileName) ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading || !internalFileName || !providerFileName} // Disable if loading or files not selected
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : 'Reconcile'}
      </button>

      {/* Message display area */}
      {message && (
        <p className="text-sm text-gray-600 mb-4 text-center">{message}</p>
      )}

      {/* Results section */}
      {results ? (
        <div className="results-section w-full space-y-8"> {/* Added space-y for vertical gap between cards */}

          {/* Matched Transactions Section Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left flex items-center">
              <span role="img" aria-label="checkmark" className="mr-2">✅</span> Matched Transactions
              <button
                onClick={() => exportCSV(results.matched, 'matched.csv')}
                className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md shadow-sm
                           hover:bg-green-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2
                           focus:ring-green-500 focus:ring-opacity-75"
              >
                Export CSV
              </button>
            </h2>
            {results.matched.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200"> {/* Removed shadow-sm here to avoid double shadow */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Sticky table headers */}
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Amount</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Amount</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Match</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Status</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Status</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status Match</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.matched.map((tx, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.transaction_reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.provider_amount}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.matched_amount ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.matched_amount ? '✅ Match' : '❌ Mismatch'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.provider_status}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.matched_status ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.matched_status ? '✅ Match' : '❌ Mismatch'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-md border border-gray-200">No matched transactions found.</p>
            )}
          </div> {/* End Matched Transactions Card */}


          {/* Only in Internal Section Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left flex items-center">
              <span role="img" aria-label="warning" className="mr-2">⚠️</span> Only in Internal
              <button
                onClick={() => exportCSV(results.onlyInternal, 'only_internal.csv')}
                className="ml-4 px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-md shadow-sm
                           hover:bg-yellow-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2
                           focus:ring-yellow-500 focus:ring-opacity-75"
              >
                Export CSV
              </button>
            </h2>
            {results.onlyInternal.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Sticky table headers */}
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.onlyInternal.map((tx, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.transaction_reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-md border border-gray-200">No internal-only transactions found.</p>
            )}
          </div> {/* End Only in Internal Card */}

          {/* Only in Provider Section Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left flex items-center">
              <span role="img" aria-label="cross mark" className="mr-2">❌</span> Only in Provider
              <button
                onClick={() => exportCSV(results.onlyProvider, 'only_provider.csv')}
                className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md shadow-sm
                           hover:bg-red-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2
                           focus:ring-red-500 focus:ring-opacity-75"
              >
                Export CSV
              </button>
            </h2>
            {results.onlyProvider.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Sticky table headers */}
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.onlyProvider.map((tx, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.transaction_reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-md border border-gray-200">No provider-only transactions found.</p>
            )}
          </div> {/* End Only in Provider Card */}

        </div>
      ) : (
        // Empty state message when no results are present
        <div className="w-full text-center py-12 px-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200 mt-8">
          <p className="text-xl text-gray-600 font-semibold mb-4">Ready to Reconcile?</p>
          <p className="text-gray-500">Upload your CSV files above and click 'Reconcile' to see the magic happen!</p>
          <p className="text-sm text-gray-400 mt-2">
            Make sure your CSVs have a 'transaction_reference' column for comparison.
          </p>
        </div>
      )}
    </div>
  );
}

export default Reconciliation;
