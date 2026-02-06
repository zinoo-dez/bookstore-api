# Testing Guide

## Server Status

### Backend
- **URL**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Status**: ✅ Running

### Frontend
- **URL**: http://localhost:3001
- **Status**: ✅ Running

### CORS Configuration
- **Allowed Origin**: http://localhost:3001
- **Status**: ✅ Configured

## Quick Test Steps

### 1. View Books
1. Open http://localhost:3001/books
2. You should see 35 books displayed
3. Try searching by title or author
4. Try sorting options

### 2. Register & Login
1. Go to http://localhost:3001/register
2. Create a new account or use test account:
   - Email: user1@bookstore.com
   - Password: user123

### 3. Add to Cart
1. Browse books at /books
2. Click "Add to Cart" on any book
3. Or click a book to view details and add from there
4. Check cart icon in navbar (should show count)

### 4. View Cart
1. Click cart icon or go to /cart
2. Update quantities
3. Remove items
4. See order summary

### 5. Checkout
1. From cart, click "Proceed to Checkout"
2. Fill in shipping information:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 1234567890
   - Address: 123 Main St
   - City: New York
   - State: NY
   - ZIP: 10001
   - Country: USA
3. Select payment method
4. Click "Place Order"

### 6. Order Confirmation
1. After successful order, you'll see confirmation page
2. Note the order number
3. Check order details

### 7. Order History
1. Go to /orders
2. View all your orders
3. See order status and items

### 8. Admin Features (Admin Only)
1. Login as admin:
   - Email: admin@bookstore.com
   - Password: admin123
2. Go to /admin
3. Manage books, orders, users

## Common Issues & Solutions

### Issue: Can't see books
**Solution**: 
- Check CORS is set to http://localhost:3001 in backend/.env
- Restart backend server
- Check browser console for errors

### Issue: Can't add to cart
**Solution**:
- Make sure you're logged in
- Check network tab for API errors
- Verify backend is running

### Issue: Checkout fails
**Solution**:
- Ensure cart has items
- Check all form fields are filled
- Verify backend order API is working

### Issue: CORS errors
**Solution**:
- Update backend/.env: CORS_ORIGIN=http://localhost:3001
- Restart backend server

## API Testing (Optional)

### Test Books API
```bash
curl http://localhost:3000/books
```

### Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@bookstore.com","password":"user123"}'
```

### Test Cart (with token)
```bash
TOKEN="your-jwt-token"
curl http://localhost:3000/cart \
  -H "Authorization: Bearer $TOKEN"
```

## Database Check

### View all books
```bash
cd backend
npx prisma studio
```
This opens a GUI to view database contents.

### Check users
```bash
node check-users.js
```

## Troubleshooting

### Reset Database
```bash
cd backend
npm run prisma:reset
npm run seed
```

### Clear Frontend Cache
1. Open browser DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Check Server Logs
- Backend logs: Check terminal running `npm run start:dev`
- Frontend logs: Check browser console (F12)

## Test Accounts

### Admin
- Email: admin@bookstore.com
- Password: admin123

### Regular Users
- Email: user1@bookstore.com, user2@bookstore.com, user3@bookstore.com
- Password: user123

## Expected Behavior

### Books Page
- Shows 12 books per page
- Search works for title and author
- Sorting works (title, author, price, date)
- "Add to Cart" button visible when logged in
- "Login to Add" shown when not logged in

### Cart
- Shows all items with quantities
- Can update quantities (respects stock limits)
- Can remove items
- Shows subtotal, tax, and total
- "Proceed to Checkout" button enabled

### Checkout
- Form validation works
- Payment method selection works
- Order creation succeeds
- Redirects to confirmation page

### Order Confirmation
- Shows order number
- Displays all order items
- Shows total paid
- Links to order history work

### Order History
- Lists all user orders
- Shows order status
- Displays order items
- Shows order totals
