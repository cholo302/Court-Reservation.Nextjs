import QRCode from 'qrcode'

export async function generateGCashQRCode(phoneNumber: string): Promise<string> {
  try {
    // Generate QR code as data URL (PNG)
    // Format the data appropriately for GCash
    const qrCodeDataUrl: string = await (QRCode as any).toDataURL(phoneNumber, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    } as any)
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}
