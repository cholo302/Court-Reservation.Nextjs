# GCash QR Code Setup Guide

## ⚡ Super Simple Setup (1 Step!)

The QR code is now **automatically generated** from your phone number. No file uploads needed!

### Just One Thing to Do:

Edit or create `.env.local` in your project root:

```env
# Add your GCash phone number - that's it!
NEXT_PUBLIC_GCASH_PHONE="09123456789"
```

**Replace `09123456789` with your actual GCash number**

---

## ✅ Verify It Works

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to a booking payment page:
   ```
   http://localhost:3000/bookings/[id]/pay
   ```

3. You should see:
   - ✅ Your QR code generated and displayed
   - ✅ Your GCash phone number shown
   - ✅ Instructions to scan or send money

**That's all!**

---

## How It Works

The payment page automatically:
1. Reads your phone number from `NEXT_PUBLIC_GCASH_PHONE`
2. Generates a high-quality QR code on the fly
3. Displays it to customers
4. Shows your phone number as backup option

No static images, no file management, completely automated! 🎉

---

## Troubleshooting

### Phone Number Not Showing

**Problem**: Showing "09XX-XXX-XXXX" as placeholder

**Solution**:
1. Make sure `.env.local` exists with:
   ```env
   NEXT_PUBLIC_GCASH_PHONE="09123456789"
   ```
2. Variable **must** start with `NEXT_PUBLIC_` (important!)
3. Restart dev server: `npm run dev`

### QR Code Not Displaying

**Problem**: Still seeing "Generating QR Code..."

**Solution**:
1. Check browser console (F12) for errors
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+Delete)
4. Verify phone number format (11 digits)

---

## Complete Configuration Example

Your `.env.local` should look like:

```env
# Database
DATABASE_URL="file:./court_reservation.sqlite"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# GCash Payment (THE IMPORTANT ONE!)
NEXT_PUBLIC_GCASH_PHONE="09123456789"

# Optional
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## How the QR Code Works

✅ **Automatic Generation**
- QR code is generated from your phone number
- Generated fresh each time the page loads
- High quality PNG format
- Automatically updates if you change the phone number

✅ **Client-Side Rendering**
- No server processing needed
- Works instantly in the browser
- Can be scanned immediately

✅ **Fallback Support**
- Phone number shown as backup
- Customers can manually transfer if scan fails

---

## Production Deployment

When deploying to production:

1. Set environment variable on your hosting platform:
   ```
   NEXT_PUBLIC_GCASH_PHONE=09123456789
   ```

2. Verify it's accessible in browser (it should be - it has `NEXT_PUBLIC_` prefix)

3. Monitor that customers can scan the QR code

---

## Support

If QR code isn't working:
1. Check `.env.local` has correct phone number
2. Verify `NEXT_PUBLIC_` prefix is present
3. Restart dev server after changing env vars
4. Check browser console (F12) for JavaScript errors

**Questions?** Review the payment page code at `src/app/bookings/[id]/pay/page.tsx`

