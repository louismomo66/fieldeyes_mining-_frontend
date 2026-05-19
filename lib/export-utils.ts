// Export utilities for CSV and PDF generation

// Generate a consistent serial number for a user based on signup date and user ID
// This ensures ALL reports for the same user have the same serial number
// Format: YYYYMMDD + user number (3 digits padded)
// Example: User 1 signed up on 2024-12-04 = 20241204001
export async function generateUserSerialNumber(): Promise<string> {
  try {
    const { apiService } = await import('./api')
    const response = await apiService.getUserSerialNumber()
    if (response.success && response.data && response.data.serial_number) {
      return response.data.serial_number
    }
    // Fallback if API fails
    return '00000000000'
  } catch (error) {
    console.error('Error fetching serial number:', error)
    // Fallback if API fails
    return '00000000000'
  }
}

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
  // For CSV, we need to properly escape values and format numbers without commas
  // to avoid breaking CSV structure. Wrap values in quotes if they contain commas.
  const csvRows = data.map(row =>
    row.map(cell => {
      // Remove any existing commas from numbers and format properly
      const numMatch = cell.match(/^[\d,]+\.?\d*$/)
      if (numMatch) {
        // Remove commas and format as plain number with 2 decimal places
        const num = parseFloat(cell.replace(/,/g, ""))
        if (!isNaN(num)) {
          // Format number without commas for CSV (Excel will format it)
          return num.toFixed(2)
        }
      }
      // If cell contains comma, wrap in quotes
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    })
  )

  // Join rows with commas and escape properly
  const csvContent = csvRows.map(row => row.join(",")).join("\n")
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
  // Load logo as base64 to ensure it displays in PDF
  const loadLogoAsBase64 = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          try {
            const base64 = canvas.toDataURL('image/png')
            resolve(base64)
          } catch (e) {
            resolve('')
          }
        } else {
          resolve('')
        }
      }
      img.onerror = () => resolve('')
      // Try to load from public folder
      img.src = window.location.origin + src
    })
  }

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

  // Load logos and generate PDF
  Promise.all([
    loadLogoAsBase64('/logo.png')
  ]).then(([logoBase64]) => {
    const logoImg = logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" class="logo" />` : ''
    const generatedDate = new Date().toLocaleString()

    // Create a printable HTML document
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
          <title>${escapeHtml(title)}</title>
        <style>
          @media print {
              @page { 
                margin: 1cm;
                @bottom-center {
                  content: "Generated on ${generatedDate}";
                  font-size: 10px;
                  color: #666;
                }
              }
              .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
              margin: 0;
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
          <div className="header">
            <div style="display: flex; align-items: center; gap: 15px;">
              ${logoImg}
            </div>
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
            Generated on ${generatedDate}
        </div>
        <script>
            (function() {
              // Immediately update document title to prevent blob URL from showing
              if (document.title === '' || document.title.includes('blob:')) {
                document.title = "${escapeHtml(title)}";
              }
              
              // Override window.location to prevent blob URL from appearing
              try {
                Object.defineProperty(window, 'location', {
                  value: { href: '', origin: window.location.origin },
                  writable: false
                });
              } catch(e) {}
              
          window.onload = function() {
                document.title = "${escapeHtml(title)}";
                // Small delay to ensure everything is loaded
                setTimeout(() => {
            window.print();
                }, 500);
          }
            })();
        </script>
      </body>
    </html>
  `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank")

    if (printWindow) {
      printWindow.onload = () => {
        // Immediately set title to prevent blob URL from showing
        printWindow.document.title = title
        // Try to update history to remove blob URL
        try {
          printWindow.history.replaceState({}, title, window.location.origin)
        } catch (e) { }

        setTimeout(() => {
          printWindow.print()
          // Clean up after printing
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 1000)
        }, 500)
      }
    }
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

