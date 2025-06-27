Mini Reconciliation Tool
Overview
The Mini Reconciliation Tool is a web application designed to help businesses quickly compare transaction data between their internal systems and payment provider statements. It identifies and highlights discrepancies, providing a clear summary of matched, internal-only, and provider-only transactions. This tool aims to streamline the reconciliation process, ensuring financial accuracy.

Features
This application fulfills the requirements of the "Mini Reconciliation Tool" challenge, offering the following functionalities:

CSV File Upload: Intuitive drag-and-drop or click-to-upload functionality for both "Internal System Export" and "Provider Statement" CSV files.

Transaction Comparison: Compares transactions based on a common transaction_reference column.

Categorized Reconciliation Summary: Displays results in three distinct categories for easy review:

✅ Matched Transactions: Transactions found in both files.

⚠️ Present only in Internal file: Transactions unique to the internal system export.

❌ Present only in Provider file: Transactions unique to the provider statement.

Discrepancy Highlighting: Within "Matched Transactions," any mismatches in amount or status are clearly highlighted.

Export Functionality: "Export as CSV" buttons for each reconciliation category, allowing users to download detailed reports.

Enhanced User Interface: A clean, modern, and responsive design with a green, white, and black color scheme, featuring:

A prominent, descriptive header.

Clear visual feedback for file uploads (file name display, clear button, drag-over effects).

Sticky table headers for improved readability of long result lists.

An informative empty state message before reconciliation.

Tactile button effects and a loading spinner.

Technologies Used
React: For building the user interface.

Vite: As the fast development build tool.

Tailwind CSS (via CDN): For utility-first styling, enabling rapid and responsive UI development with a consistent design system.

PapaParse (via CDN): A powerful CSV parser for handling file uploads and data conversion client-side.

How to Run Locally
To get this project up and running on your local machine, follow these steps:

Clone the Repository:

git clone <https://github.com/WambuiJoan-dev/Reconciliation-Tool.git>
cd mini-reconciliation-tool

Install Dependencies:
Make sure you have Node.js and npm (or Yarn) installed.

npm install
# or
yarn install

Start the Development Server:

npm run dev
# or
yarn dev

This will start the Vite development server, usually at http://localhost:5173. Your browser should automatically open to this address.

Build for Production (Optional):
To create a production-ready build of your application:

npm run build
# or
yarn build

This will generate optimized static assets in the dist/ directory.

How to Use the Tool
Upload CSV Files:

Drag and drop your "Internal System Export" CSV file into the left upload area, or click the area to browse and select the file.

Repeat the process for your "Provider Statement" CSV file in the right upload area.

The file name will appear, and you can clear it using the "Clear" button if needed.

Reconcile Data:

Once both files are uploaded, click the "Reconcile" button.

View Results:

The tool will display three sections: "Matched Transactions," "Only in Internal," and "Only in Provider."

Mismatched amounts or statuses in "Matched Transactions" will be highlighted.

Export Reports:

Click the "Export CSV" button next to each category to download the respective data.

Deployment
This application is designed to be purely client-side, requiring no backend. It can be easily deployed as a static site to platforms like Render, Netlify, Vercel, or Replit.