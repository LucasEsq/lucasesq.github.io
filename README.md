# Habits & Todos Tracker

A minimalist, privacy-focused habit and todo tracker with client-side encryption. Only you and your friends can access your data, and it's encrypted before being sent to the database.

## Features

- ✅ **Habits tracking** - Daily recurring habits
- ✅ **Todo management** - One-time tasks with completion dates
- ✅ **Calendar view** - Visual overview of completions
- ✅ **Statistics** - Track your progress over time
- ✅ **Client-side encryption** - Your data is encrypted before it reaches the database
- ✅ **Dark/Light mode** - Automatically detects system preference
- ✅ **Manual user management** - Only people you add can use the app
- ✅ **100% Free** - Uses Supabase free tier and GitHub Pages

## Security Model

All your habits and todos are encrypted on your device before being sent to Supabase. Even if someone gains access to the database, they'll only see encrypted gibberish. Your password never leaves your device and is used to derive an encryption key locally.

**Important**: If you forget your password, your data cannot be recovered. There is no password reset with true client-side encryption.

## Setup Instructions

### 1. Set up Supabase (10 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - **Name**: habits-tracker (or whatever you want)
   - **Database Password**: Create a strong password and save it
   - **Region**: Choose closest to you
4. Wait ~2 minutes for setup to complete

### 2. Create Database Tables

Once your project is ready:

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Paste this SQL code:

```sql
-- Create habits table
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completions table
CREATE TABLE completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id, item_type, date)
);

-- Enable Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only see their own data
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own completions"
  ON completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
  ON completions FOR DELETE
  USING (auth.uid() = user_id);
```

4. Click **Run** (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned"

### 3. Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string of characters)

### 4. Configure the App

1. Open `index.html` in a text editor
2. Find these lines near the top of the JavaScript (around line 245):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...your-long-key-here';
```

4. Save the file

### 5. Deploy to GitHub Pages

#### Option A: Using GitHub Website

1. Create a GitHub account if you don't have one
2. Create a new repository:
   - Click the **+** button → **New repository**
   - Name it `habits-tracker` (or whatever you want)
   - Make it **Public** (required for free GitHub Pages)
   - Click **Create repository**
3. Upload your file:
   - Click **uploading an existing file**
   - Drag and drop `index.html`
   - Click **Commit changes**
4. Enable GitHub Pages:
   - Go to **Settings** → **Pages**
   - Under **Source**, select **main** branch
   - Click **Save**
5. Wait ~1 minute, then visit: `https://yourusername.github.io/habits-tracker/`

#### Option B: Using Git Command Line

```bash
git init
git add index.html README.md
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/habits-tracker.git
git push -u origin main
```

Then enable GitHub Pages in Settings → Pages.

### 6. Add Users (You and Your Friends)

1. Go to your Supabase project
2. Click **Authentication** in the sidebar
3. Click **Users** tab
4. Click **Invite User**
5. Enter their email address
6. They'll receive an email with a link to set their password
7. That's it! They can now login at your GitHub Pages URL

**For each user:**
- They'll get an email from Supabase
- They click the reset password link
- They set their own secure password
- They can then login to your app
- Their data is automatically encrypted with their password

### 7. Disable Public Signups (Important!)

By default, anyone can create an account. To restrict this:

1. Go to **Authentication** → **Providers** in Supabase
2. Click on **Email**
3. **Disable** "Enable email signups"
4. Click **Save**

Now only users you manually invite can access the app.

## How to Use

### Adding Habits
1. Go to the **Habits** page
2. Click the **+** button
3. Enter a title (e.g., "Exercise", "Read", "Meditate")
4. Optionally add a description
5. Click **Create**

### Adding Todos
1. Go to the **Todos** page
2. Click the **+** button
3. Enter a title (e.g., "Buy groceries", "Call dentist")
4. Click **Create**

### Tracking Progress
1. Go to the **Calendar** page
2. Click on any date to see habits and todos for that day
3. Check off completed items
4. Green checkmarks show what you've completed

### Viewing Stats
1. Go to the **Stats** page
2. See your habit completion percentages over 7, 14, or 30 days
3. See how many todos you've completed on different days

## Troubleshooting

### "Failed to load data"
- Make sure you've updated `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the code
- Check that you created all the database tables
- Verify Row Level Security policies are enabled

### "User not found"
- Make sure you've added the user through Supabase Authentication
- Check that they've confirmed their email and set a password

### "Cannot decrypt data"
- You're using the wrong password
- Data was encrypted with a different password
- Unfortunately, there's no way to recover if you've forgotten your password

### GitHub Pages not working
- Make sure your repository is public
- Wait a few minutes after enabling Pages
- Check Settings → Pages shows a green "Your site is published" message

## Privacy & Security

- All data (habits, todos, descriptions) is encrypted before leaving your device
- Encryption uses AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- Your password is never sent to the server
- Supabase only stores encrypted blobs
- Row Level Security ensures users can only access their own data
- Even Supabase administrators cannot read your data

## Cost

This setup is completely free:
- Supabase Free Tier: 500MB database, 2GB bandwidth/month
- GitHub Pages: Free for public repositories
- Total cost: **$0/month**

For 10 users with daily usage, you'll use less than 1MB of database space.

## Advanced: Custom Domain (Optional)

If you want to use your own domain instead of `username.github.io`:

1. Buy a domain (e.g., from Namecheap, ~$12/year)
2. In your GitHub repo, go to Settings → Pages
3. Enter your custom domain under "Custom domain"
4. Update your domain's DNS settings:
   - Add a CNAME record pointing to `yourusername.github.io`
5. Wait for DNS to propagate (~1 hour)

## Support

If you run into issues:
1. Check the browser console for error messages (F12 → Console tab)
2. Verify all setup steps were completed
3. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)

## License

MIT - Feel free to modify and use as you wish!
