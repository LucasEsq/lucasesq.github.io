function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme =
      localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');

    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogin = async (password) => {
    setEncryptionKey(password);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEncryptionKey(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!encryptionKey) {
    return <LoginPage onLogin={handleLogin} user={user} />;
  }

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