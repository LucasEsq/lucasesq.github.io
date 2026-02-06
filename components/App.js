function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [theme, setTheme] = useState('light');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Set theme first
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Check for existing session
    const checkSession = async () => {
      try {
        // First, try to get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }
        
        if (session?.user) {
          setUser(session.user);
          console.log('User found in session:', session.user.email);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        // Clear encryption key on sign out
        if (event === 'SIGNED_OUT') {
          setEncryptionKey(null);
        }
        
        // If signed in and we have encryption key in localStorage, restore it
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          const savedKey = localStorage.getItem('encryption_key');
          if (savedKey && session?.user) {
            setEncryptionKey(savedKey);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogin = async (password) => {
    // Store encryption key in state
    setEncryptionKey(password);
    // Also store in localStorage (optional, but helps with refresh)
    localStorage.setItem('encryption_key', password);
  };

  const handleLogout = async () => {
    // Clear encryption key from state and localStorage
    setEncryptionKey(null);
    localStorage.removeItem('encryption_key');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    setUser(null);
  };

  // Show loading until session check is complete
  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // User is logged into Supabase but hasn't entered encryption key
  if (user && !encryptionKey) {
    return <LoginPage onLogin={handleLogin} user={user} />;
  }

  // No user at all - show full login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // User is logged in and has encryption key
  return (
    <MainApp
      user={user}
      encryptionKey={encryptionKey}
      onLogout={handleLogout}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}