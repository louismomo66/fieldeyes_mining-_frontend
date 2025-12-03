// Export utilities for CSV and PDF generation

// Format number with commas (thousands separator)
export function formatNumberWithCommas(value: number | string): string {
  if (typeof value === "string") {
    // Try to parse as number
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Format currency with commas (removes currency symbol for CSV)
export function formatCurrencyForExport(amount: number): string {
  return formatNumberWithCommas(amount)
}

export function exportToCSV(data: string[][], filename: string) {
  // Format numeric values in the data with commas
  const formattedData = data.map(row => 
    row.map(cell => {
      // Check if cell is a number (including currency strings)
      const numMatch = cell.match(/^[\d,]+\.?\d*$/)
      if (numMatch) {
        // Remove existing commas and format
        const num = parseFloat(cell.replace(/,/g, ""))
        if (!isNaN(num)) {
          return formatNumberWithCommas(num)
        }
      }
      return cell
    })
  )
  
  const csvContent = formattedData.map(row => row.join(",")).join("\n")
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

export function exportToPDF(headers: string[], rows: string[][], title: string, filename: string, serialNumber?: string) {
  // Get logo path (try logo.png first, fallback to placeholder)
  const logoPath = "/logo.png"
  
  // Format numeric values in rows with commas
  const formattedRows = rows.map(row => 
    row.map(cell => {
      // Check if cell is a number (including currency strings)
      const numMatch = cell.match(/^[\d,]+\.?\d*$/)
      if (numMatch) {
        // Remove existing commas and format
        const num = parseFloat(cell.replace(/,/g, ""))
        if (!isNaN(num)) {
          return formatNumberWithCommas(num)
        }
      }
      return cell
    })
  )
  
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
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .logo {
            max-height: 60px;
            max-width: 150px;
            object-fit: contain;
          }
          .header-info {
            text-align: right;
          }
          .header-info h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .serial-number {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
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
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoPath}" alt="Logo" class="logo" onerror="this.style.display='none'" />
          <div class="header-info">
            <h1>${escapeHtml(title)}</h1>
            ${serialNumber ? `<div class="serial-number">Serial Number: ${escapeHtml(serialNumber)}</div>` : ""}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${formattedRows.map(row => 
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

