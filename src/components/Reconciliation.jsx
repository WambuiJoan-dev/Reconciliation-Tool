import React, { useState } from 'react';
import Papa from 'papaparse';
import './Reconciliation.css';  // We’ll create this CSS file next

function Reconciliation() {
  const [internalData, setInternalData] = useState([]);
  const [providerData, setProviderData] = useState([]);
  const [results, setResults] = useState(null);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setter(result.data);
        },
      });
    }
  };

  const reconcile = () => {
    const internalMap = new Map(internalData.map(tx => [tx.transaction_reference, tx]));
    const providerMap = new Map(providerData.map(tx => [tx.transaction_reference, tx]));

    const matched = [];
    const onlyInternal = [];
    const onlyProvider = [];

    internalMap.forEach((intTx, ref) => {
      if (providerMap.has(ref)) {
        const provTx = providerMap.get(ref);
        matched.push({
          ...intTx,
          matched_amount: intTx.amount === provTx.amount,
          matched_status: intTx.status === provTx.status,
          provider_amount: provTx.amount,
          provider_status: provTx.status
        });
      } else {
        onlyInternal.push(intTx);
      }
    });

    providerMap.forEach((provTx, ref) => {
      if (!internalMap.has(ref)) {
        onlyProvider.push(provTx);
      }
    });

    setResults({ matched, onlyInternal, onlyProvider });
  };

  const exportCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reconciliation-container">
      <div className="upload-section">
        <label>
          Internal CSV:
          <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, setInternalData)} />
        </label>
        <label>
          Provider CSV:
          <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, setProviderData)} />
        </label>
        <button onClick={reconcile}>Reconcile</button>
      </div>

      {results && (
        <div className="results-section">
          <h2>✅ Matched Transactions</h2>
          <button onClick={() => exportCSV(results.matched, 'matched.csv')}>Export CSV</button>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Internal Amount</th>
                <th>Provider Amount</th>
                <th>Amount Match</th>
                <th>Internal Status</th>
                <th>Provider Status</th>
                <th>Status Match</th>
              </tr>
            </thead>
            <tbody>
              {results.matched.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.transaction_reference}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.provider_amount}</td>
                  <td className={tx.matched_amount ? 'match' : 'mismatch'}>
                    {tx.matched_amount ? '✅' : '❌'}
                  </td>
                  <td>{tx.status}</td>
                  <td>{tx.provider_status}</td>
                  <td className={tx.matched_status ? 'match' : 'mismatch'}>
                    {tx.matched_status ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>⚠️ Only in Internal</h2>
          <button onClick={() => exportCSV(results.onlyInternal, 'only_internal.csv')}>Export CSV</button>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.onlyInternal.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.transaction_reference}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>❌ Only in Provider</h2>
          <button onClick={() => exportCSV(results.onlyProvider, 'only_provider.csv')}>Export CSV</button>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.onlyProvider.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.transaction_reference}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reconciliation;
