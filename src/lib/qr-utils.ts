import QRCode from 'qrcode'

export async function generateGCashQRCode(phoneNumber: string): Promise<string> {
  try {
    // Generate QR code as data URL (PNG)
    // Format the data appropriately for GCash
    const qrCodeDataUrl = await QRCode.toDataURL(phoneNumber, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}
