# Cloud Integration Setup Guide

Follow these steps to set up the necessary cloud services (MongoDB Atlas) for the Workout Analyzer.

## 1. MongoDB Atlas Setup (Database)

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up (free).
2.  **Create a Cluster**:
    - Choose **Shared** (FREE) tier.
    - Select a provider (AWS) and region closest to you (e.g., Singapore).
    - Click **Create Cluster**.
3.  **Create a Database User**:
    - Go to **Database Access** (sidebar).
    - Click **Add New Database User**.
    - Authentication Method: **Password**.
    - Username: `admin` (or your choice).
    - Password: **Generate a strong password** and copy it safely.
    - Privileges: **Read and write to any database**.
    - Click **Add User**.
4.  **Network Access (IP Whitelist)**:
    - Go to **Network Access** (sidebar).
    - Click **Add IP Address**.
    - Choose **Allow Access from Anywhere** (0.0.0.0/0). _Note: For production, you'd limit this, but for this Vercel/dynamic IP setup, this is easiest._
    - Click **Confirm**.
5.  **Get Connection String**:
    - Go to **Database** (sidebar).
    - Click **Connect** on your cluster.
    - Choose **Drivers** (Node.js).
    - Copy the connection string. It looks like:
      `mongodb+srv://admin:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    - **Replace `<db_password>`** with the password you created in step 3.

## 2. Environment Variables

Update your `.env.local` file with the following new variables:

```env
# Existing
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
GEMINI_API_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# NEW: MongoDB
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/workout-analyzer?retryWrites=true&w=majority

# NEW: NextAuth
AUTH_SECRET=generate_a_random_string_here
# You can generate one via terminal: openssl rand -base64 32
```

## 3. Strava Callback Update (If needed)

If you are just running on localhost, no change needed.
However, for NextAuth, ensure your **Authorization Callback Domain** in Strava Settings includes `localhost`.
