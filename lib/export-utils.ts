// Export utilities for CSV and PDF generation

export function exportToCSV(data: string[][], filename: string) {
  const csvContent = data.map(row => row.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToPDF(headers: string[], rows: string[][], title: string, filename: string) {
  // Create a printable HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => 
              `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
            ).join("")}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleString()}
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `
  
  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, "_blank")
  
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Clean up after printing
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
      }, 250)
    }
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

