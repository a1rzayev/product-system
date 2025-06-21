import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const orderId = params.id

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Check if user has access to this order
    if (session?.user?.role !== 'ADMIN') {
      if (!session?.user?.id || order.customerId !== session.user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // Parse billing address from JSON string
    const billingInfo = JSON.parse(order.billingAddress || '{}')

    // Generate HTML content for the invoice
    const htmlContent = generateInvoiceHTML(order, billingInfo)

    // Convert HTML to PDF using a more robust approach
    const pdfBuffer = await generatePDF(htmlContent)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Bill generation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(order: any, billingInfo: any) {
  const orderDate = new Date(order.createdAt).toLocaleDateString()
  const orderTime = new Date(order.createdAt).toLocaleTimeString()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info {
          text-align: center;
          margin-bottom: 30px;
        }
        .company-info h1 {
          margin: 0 0 10px 0;
          color: #2563eb;
          font-size: 24px;
        }
        .company-info p {
          margin: 5px 0;
          color: #666;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .billing-info, .invoice-info {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h3, .billing-info h3 {
          margin: 0 0 10px 0;
          color: #2563eb;
          font-size: 16px;
        }
        .invoice-info p, .billing-info p {
          margin: 3px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .total-row td {
          border-top: 2px solid #333;
        }
        .grand-total {
          font-size: 14px;
          color: #2563eb;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        .order-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-confirmed {
          background-color: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>Product System</h1>
          <p>123 Commerce Street<br>
          Business City, BC 12345<br>
          Phone: (555) 123-4567<br>
          Email: info@productsystem.com<br>
          Website: www.productsystem.com</p>
        </div>
      </div>

      <div class="invoice-details">
        <div class="billing-info">
          <h3>Bill To:</h3>
          <p>
            <strong>${billingInfo.firstName || order.customer?.name || 'Customer'} ${billingInfo.lastName || ''}</strong><br>
            ${billingInfo.address || 'Address not provided'}<br>
            ${billingInfo.city || 'City'}, ${billingInfo.state || 'State'} ${billingInfo.zipCode || 'ZIP'}<br>
            ${billingInfo.country || 'Country'}<br>
            Email: ${billingInfo.email || order.customer?.email || 'Email not provided'}<br>
            Phone: ${billingInfo.phone || 'Phone not provided'}
          </p>
        </div>
        <div class="invoice-info">
          <h3>Invoice Details:</h3>
          <p>
            <strong>Invoice Number:</strong> ${order.orderNumber}<br>
            <strong>Order ID:</strong> ${order.id}<br>
            <strong>Date:</strong> ${orderDate}<br>
            <strong>Time:</strong> ${orderTime}<br>
            <strong>Status:</strong> 
            <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span><br>
            <strong>Due Date:</strong> ${orderDate}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 40%;">Item Description</th>
            <th style="width: 15%;">SKU</th>
            <th style="width: 10%;">Qty</th>
            <th style="width: 15%;">Unit Price</th>
            <th style="width: 15%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${item.product.name}</strong></td>
              <td>${item.product.sku}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" style="text-align: right;"><strong>Subtotal:</strong></td>
            <td><strong>$${order.subtotal.toFixed(2)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="5" style="text-align: right;"><strong>Tax:</strong></td>
            <td><strong>$${order.tax.toFixed(2)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="5" style="text-align: right;"><strong>Shipping:</strong></td>
            <td><strong>$${order.shipping.toFixed(2)}</strong></td>
          </tr>
          ${order.discount > 0 ? `
            <tr class="total-row">
              <td colspan="5" style="text-align: right;"><strong>Discount:</strong></td>
              <td><strong>-$${order.discount.toFixed(2)}</strong></td>
            </tr>
          ` : ''}
          <tr class="total-row grand-total">
            <td colspan="5" style="text-align: right;"><strong>GRAND TOTAL:</strong></td>
            <td><strong>$${order.total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 10px;">Order Summary:</h3>
        <p><strong>Total Items:</strong> ${order.items.length}</p>
        <p><strong>Total Quantity:</strong> ${order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
        <p><strong>Payment Method:</strong> Online Payment</p>
        <p><strong>Order Notes:</strong> ${order.notes || 'No additional notes'}</p>
      </div>

      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>For questions or support, please contact us at support@productsystem.com</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `
}

async function generatePDF(htmlContent: string): Promise<Buffer> {
  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    await browser.close()
    
    return pdfBuffer
  } catch (error) {
    console.error('PDF generation error:', error)
    
    // Fallback to simple text-based PDF if Puppeteer fails
    const fallbackContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 12 Tf
72 720 Td
(INVOICE GENERATED) Tj
/F1 10 Tf
0 -20 Td
(PDF generation failed - using fallback) Tj
0 -15 Td
(Please contact support for proper invoice) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
800
%%EOF
    `
    
    return Buffer.from(fallbackContent, 'utf8')
  }
} 