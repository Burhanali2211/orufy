export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: {
    streetAddress?: string;
    street_address?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    postal_code?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
  }>;
  subtotal: number | string;
  tax?: number | string;
  shipping?: number | string;
  discount?: number | string;
  total: number | string;
  paymentMethod: string;
  storeName?: string;
}

export function generateInvoicePrintWindow(data: InvoiceData) {
  const store = data.storeName || 'Orufy Luxury Fragrances';
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to download/print your invoice.');
    return;
  }

  const addr = data.shippingAddress;
  const addressHtml = [
    addr?.streetAddress || addr?.street_address || addr?.street,
    addr?.city && addr?.state ? `${addr.city}, ${addr.state}` : addr?.city || addr?.state,
    addr?.postalCode || addr?.postal_code,
    addr?.country || 'India'
  ].filter(Boolean).join('<br />');

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e7e5e4; font-family: sans-serif; font-size: 14px; color: #1c1917;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e7e5e4; text-align: center; font-family: sans-serif; font-size: 14px; color: #44403c;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e7e5e4; text-align: right; font-family: sans-serif; font-size: 14px; color: #44403c;">
        ₹${Number(item.unitPrice).toLocaleString('en-IN')}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e7e5e4; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #1c1917;">
        ₹${Number(item.totalPrice).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${data.orderNumber} - ${store}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1c1917; margin: 0; padding: 40px; }
          .invoice-box { max-width: 700px; margin: auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 16px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1c1917; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-family: Georgia, serif; font-weight: bold; color: #1c1917; letter-spacing: -0.5px; }
          .meta { text-align: right; font-size: 13px; color: #78716c; }
          .meta strong { color: #1c1917; font-size: 15px; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 24px; }
          .col { flex: 1; font-size: 13px; line-height: 1.5; }
          .col h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #a8a29e; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f5f5f4; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #57534e; border-bottom: 1px solid #e7e5e4; }
          .summary { margin-left: auto; width: 280px; font-size: 14px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; color: #57534e; }
          .summary-row.total { font-weight: bold; font-size: 18px; color: #1c1917; border-top: 2px solid #1c1917; padding-top: 10px; margin-top: 6px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 12px; color: #a8a29e; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="brand">${store}</div>
              <div style="font-size: 12px; color: #a8a29e; margin-top: 4px;">Official Tax Invoice & Receipt</div>
            </div>
            <div class="meta">
              <div>Invoice <strong>#${data.orderNumber}</strong></div>
              <div>Date: ${new Date(data.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div>Payment: <strong>${data.paymentMethod}</strong></div>
            </div>
          </div>

          <div class="grid">
            <div class="col">
              <h4>Billed / Shipped To</h4>
              <strong>${data.customerName || 'Valued Customer'}</strong><br />
              ${data.customerEmail ? `${data.customerEmail}<br />` : ''}
              ${data.customerPhone ? `${data.customerPhone}<br />` : ''}
              ${addressHtml || 'Digital Order Delivery'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${Number(data.subtotal).toLocaleString('en-IN')}</span>
            </div>
            ${Number(data.discount) > 0 ? `
              <div class="summary-row" style="color: #15803d;">
                <span>Discount:</span>
                <span>-₹${Number(data.discount).toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div class="summary-row">
              <span>Shipping & Insurance:</span>
              <span>${Number(data.shipping) > 0 ? `₹${Number(data.shipping).toLocaleString('en-IN')}` : 'FREE'}</span>
            </div>
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span>₹${Number(data.total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for shopping with ${store}. For support inquiries, contact support@get-oru.com.
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
