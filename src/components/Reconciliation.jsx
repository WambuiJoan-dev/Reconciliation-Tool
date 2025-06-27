import React, { useState, useEffect } from 'react';
// Removed 'import Papa from 'papaparse';' because PapaParse is loaded via CDN in index.html
// and is available globally as 'Papa'.

// Reconciliation component for handling CSV uploads and data reconciliation
function Reconciliation() {
  const [internalData, setInternalData] = useState([]); // State to store internal CSV data
  const [providerData, setProviderData] = useState([]); // State to store provider CSV data
  const [results, setResults] = useState(null); // State to store reconciliation results
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const [message, setMessage] = useState(''); // State for displaying messages to the user

  // Function to handle file uploads and parse CSV data
  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true); // Show loading indicator
      setMessage(`Loading ${file.name}...`); // Update message
      // Use the globally available Papa object for parsing
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
          }
        });
      } else {
        setIsLoading(false);
        setMessage('PapaParse is not loaded. Please check your index.html file.');
      }
    }
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
    // Use the globally available Papa object for unparsing
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
      setMessage('PapaParse is not loaded. Cannot export CSV.');
    }
  };

  return (
    // Main container for the reconciliation tool itself
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col items-center">
      {/* Upload section */}
      <div className="upload-section flex flex-col md:flex-row justify-center items-center gap-4 mb-6 w-full">
        {/* Internal CSV upload input */}
        <label className="flex flex-col items-start w-full md:w-auto flex-grow">
          <span className="text-gray-700 font-medium mb-1">Internal CSV:</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, setInternalData)}
            className="w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100 cursor-pointer"
          />
        </label>
        {/* Provider CSV upload input */}
        <label className="flex flex-col items-start w-full md:w-auto flex-grow">
          <span className="text-gray-700 font-medium mb-1">Provider CSV:</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, setProviderData)}
            className="w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100 cursor-pointer"
          />
        </label>
        {/* Reconcile button */}
        <button
          onClick={reconcile}
          className="mt-4 md:mt-0 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md
                     hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 w-full md:w-auto"
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? 'Processing...' : 'Reconcile'}
        </button>
      </div>

      {/* Message display area */}
      {message && (
        <p className="text-sm text-gray-600 mb-4">{message}</p>
      )}

      {/* Results section */}
      {results && (
        <div className="results-section w-full">
          {/* Matched Transactions Section */}
          <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left">
            <span role="img" aria-label="checkmark">✅</span> Matched Transactions
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
            <div className="overflow-x-auto mb-8 rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Match</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status Match</th>
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
            <p className="text-gray-500 text-center mb-8">No matched transactions found.</p>
          )}


          {/* Only in Internal Section */}
          <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left">
            <span role="img" aria-label="warning">⚠️</span> Only in Internal
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
            <div className="overflow-x-auto mb-8 rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
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
            <p className="text-gray-500 text-center mb-8">No internal-only transactions found.</p>
          )}

          {/* Only in Provider Section */}
          <h2 className="text-2xl font-bold text-gray-700 mb-4 text-left">
            <span role="img" aria-label="cross mark">❌</span> Only in Provider
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
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Reference</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
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
            <p className="text-gray-500 text-center">No provider-only transactions found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Export the main App component as default
export default Reconciliation;
