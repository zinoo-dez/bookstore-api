# 🚀 Quick Start Guide

## ✅ Both Servers Are Now Running!

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/api/docs

## 📝 How to Start Servers

### Option 1: Using Background Processes (Current)
Both servers are already running in the background!

### Option 2: Manual Start (If servers stop)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 3: Start Both Together (From Root)
```bash
npm run dev
```

## 🛑 How to Stop Servers

If you need to stop the servers:

```bash
# Kill backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Kill frontend (port 3001)
lsof -ti:3001 | xargs kill -9
```

## 🔍 Check if Servers are Running

```bash
# Check backend
curl http://localhost:3000

# Check frontend
curl http://localhost:3001
```

## 🧪 Test the Application

1. **Open Frontend**: http://localhost:3001

2. **Register a New User**:
   - Click "Register"
   - Fill in:
     - Name: Your Name
     - Email: your@email.com
     - Password: password123
   - Click "Create account"

3. **Login**:
   - Use the credentials you just created
   - You should be redirected to the home page

4. **Browse Books**:
   - Click "Books" in the navigation
   - You should see a list of books

## ⚠️ Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend won't start
```bash
cd backend
rm -rf node_modules
npm install
npm run start:dev
```

### Port already in use
```bash
# Kill the process using the port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
```

### CORS errors
Make sure `CORS_ORIGIN=http://localhost:3001` is set in `backend/.env`

### Database connection errors
Make sure PostgreSQL is running and the DATABASE_URL in `backend/.env` is correct

## 📦 Environment Files

### Backend (.env)
```
DATABASE_URL="postgresql://tharaphi@localhost:5432/bookstore"
JWT_SECRET="supersecret-jwt-key-that-is-at-least-32-characters-long"
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## 🎯 Next Steps

1. ✅ Servers are running
2. ✅ Visit http://localhost:3001
3. ✅ Register a new account
4. ✅ Login and explore the app
5. ✅ Browse books, add to cart, place orders

Enjoy your bookstore application! 📚