const { useState, useEffect } = React;

// ============================================
// CONFIG - Replace with your Supabase details
// ============================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================
// ENCRYPTION UTILITIES
// ============================================
class EncryptionService {
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(text)
    );

    const result = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength
    );
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
  }

  async decrypt(encryptedData, password) {
    try {
      const data = Uint8Array.from(
        atob(encryptedData),
        c => c.charCodeAt(0)
      );
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);

      const key = await this.deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }
}

const encryption = new EncryptionService();

// ============================================
// UTILITY COMPONENTS
// ============================================
function Stars({ count, max = 5 }) {
  return (
    <span className="stars">
      {[...Array(max)].map((_, i) => (
        <span
          key={i}
          className={i < count ? 'star' : 'star empty'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-selector">
      {[1, 2, 3, 4, 5].map(num => (
        <button
          key={num}
          type="button"
          className={`star-btn ${
            num <= (hover || value)
              ? 'selected'
              : 'unselected'
          }`}
          onMouseEnter={() => setHover(num)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(num)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ============================================
// APP COMPONENT
// ============================================
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

// ============================================
// LOGIN PAGE
// ============================================
function LoginPage({ onLogin, user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
      }

      onLogin(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Habits &amp; Todos</h1>
        <form onSubmit={handleSubmit}>
          {!user && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
function MainApp({ user, encryptionKey, onLogout, theme, toggleTheme }) {
  const [page, setPage] = useState('habits');
  const [categories, setCategories] = useState([]);
  const [habits, setHabits] = useState([]);
  const [todos, setTodos] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      const { data: todosData } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);

      const { data: completionsData } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', user.id);

      const decryptedCategories = await Promise.all(
        (categoriesData || []).map(async (c) => ({
          ...c,
          name: await encryption.decrypt(c.name, encryptionKey)
        }))
      );

      const decryptedHabits = await Promise.all(
        (habitsData || []).map(async (h) => ({
          ...h,
          title: await encryption.decrypt(h.title, encryptionKey),
          description: h.description
            ? await encryption.decrypt(h.description, encryptionKey)
            : ''
        }))
      );

      const decryptedTodos = await Promise.all(
        (todosData || []).map(async (t) => ({
          ...t,
          title: await encryption.decrypt(t.title, encryptionKey),
          description: t.description
            ? await encryption.decrypt(t.description, encryptionKey)
            : ''
        }))
      );

      setCategories(decryptedCategories.filter((c) => c.name));
      setHabits(decryptedHabits.filter((h) => h.title));
      setTodos(decryptedTodos.filter((t) => t.title));
      setCompletions(completionsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name, color) => {
    const encryptedName = await encryption.encrypt(name, encryptionKey);
    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: user.id, name: encryptedName, color }])
      .select();

    if (!error && data) {
      setCategories([...categories, { ...data[0], name }]);
    }
  };

  const deleteCategory = async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(categories.filter((c) => c.id !== id));
  };

  const addHabit = async (title, description, categoryId, difficulty) => {
    const encryptedTitle = await encryption.encrypt(title, encryptionKey);
    const encryptedDescription = description
      ? await encryption.encrypt(description, encryptionKey)
      : null;

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: user.id,
          title: encryptedTitle,
          description: encryptedDescription,
          category_id: categoryId || null,
          difficulty
        }
      ])
      .select();

    if (!error && data) {
      setHabits([...habits, { ...data[0], title, description }]);
    }
  };

  const deleteHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id);
    setHabits(habits.filter((h) => h.id !== id));
  };

  const addTodo = async (title, description, categoryId, difficulty) => {
    const encryptedTitle = await encryption.encrypt(title, encryptionKey);
    const encryptedDescription = description
      ? await encryption.encrypt(description, encryptionKey)
      : null;

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          user_id: user.id,
          title: encryptedTitle,
          description: encryptedDescription,
          category_id: categoryId || null,
          difficulty
        }
      ])
      .select();

    if (!error && data) {
      setTodos([...todos, { ...data[0], title, description }]);
    }
  };

  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter((t) => t.id !== id));
  };

  const toggleCompletion = async (itemId, itemType, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = completions.find(
      (c) =>
        c.item_id === itemId &&
        c.item_type === itemType &&
        c.date === dateStr
    );

    if (existing) {
      await supabase.from('completions').delete().eq('id', existing.id);
      setCompletions(completions.filter((c) => c.id !== existing.id));
    } else {
      const { data } = await supabase
        .from('completions')
        .insert([
          {
            user_id: user.id,
            item_id: itemId,
            item_type: itemType,
            date: dateStr
          }
        ])
        .select();

      if (data) {
        setCompletions([...completions, data[0]]);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your data...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Habits &amp; Todos</h1>
        <nav className="nav">
          <a
            className={`nav-link ${page === 'categories' ? 'active' : ''}`}
            onClick={() => setPage('categories')}
          >
            Categories
          </a>
          <a
            className={`nav-link ${page === 'habits' ? 'active' : ''}`}
            onClick={() => setPage('habits')}
          >
            Habits
          </a>
          <a
            className={`nav-link ${page === 'todos' ? 'active' : ''}`}
            onClick={() => setPage('todos')}
          >
            Todos
          </a>
          <a
            className={`nav-link ${page === 'calendar' ? 'active' : ''}`}
            onClick={() => setPage('calendar')}
          >
            Calendar
          </a>
          <a
            className={`nav-link ${page === 'stats' ? 'active' : ''}`}
            onClick={() => setPage('stats')}
          >
            Stats
          </a>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <a className="nav-link" onClick={onLogout}>
            Logout
          </a>
        </nav>
      </header>

      {page === 'categories' && (
        <CategoriesPage
          categories={categories}
          onAdd={addCategory}
          onDelete={deleteCategory}
        />
      )}
      {page === 'habits' && (
        <HabitsPage
          habits={habits}
          categories={categories}
          onAdd={addHabit}
          onDelete={deleteHabit}
        />
      )}
      {page === 'todos' && (
        <TodosPage
          todos={todos}
          categories={categories}
          onAdd={addTodo}
          onDelete={deleteTodo}
        />
      )}
      {page === 'calendar' && (
        <CalendarPage
          habits={habits}
          todos={todos}
          categories={categories}
          completions={completions}
          onToggle={toggleCompletion}
        />
      )}
      {page === 'stats' && (
        <StatsPage
          habits={habits}
          todos={todos}
          categories={categories}
          completions={completions}
        />
      )}
    </div>
  );
}

// ============================================
// CATEGORIES PAGE
// ============================================
function CategoriesPage({ categories, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <h2>Categories</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Organize your habits and todos into categories
      </p>

      <div className="categories-section">
        <h3>Your Categories</h3>
        {categories.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
            No categories yet. Click the + button to create your first category.
          </p>
        ) : (
          <div className="categories-list">
            {categories.map((category) => (
              <div key={category.id} className="category-chip">
                <div
                  className="category-color"
                  style={{ backgroundColor: category.color }}
                />
                <span className="category-name">{category.name}</span>
                <button
                  className="delete-category"
                  onClick={() => onDelete(category.id)}
                  title="Delete category"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="add-btn" onClick={() => setShowModal(true)}>
        +
      </button>
      {showModal && (
        <CategoryModal
          onClose={() => setShowModal(false)}
          onSave={onAdd}
        />
      )}
    </>
  );
}

function CategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5a3c');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name, color);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Category</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g., Work, Health, Personal"
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// HABITS PAGE
// ============================================
function HabitsPage({ habits, categories, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="items-grid">
        {habits.length === 0 && (
          <div className="empty-state">
            No habits yet. Click the + button to create your first habit.
          </div>
        )}

        {habits.map((habit) => {
          const category = categories.find((c) => c.id === habit.category_id);

          return (
            <div key={habit.id} className="item-card">
              <div className="item-info">
                <h3>{habit.title}</h3>

                <div className="item-meta">
                  {category && (
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: category.color + '20',
                        color: category.color,
                        border: `1px solid ${category.color}`
                      }}
                    >
                      {category.name}
                    </span>
                  )}
                  {habit.difficulty && <Stars count={habit.difficulty} />}
                </div>

                {habit.description && (
                  <p className="item-description">{habit.description}</p>
                )}
              </div>

              <div className="item-actions">
                <button
                  className="icon-btn"
                  onClick={() => onDelete(habit.id)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="add-btn" onClick={() => setShowModal(true)}>
        +
      </button>
      {showModal && (
        <HabitModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={onAdd}
        />
      )}
    </>
  );
}

function HabitModal({ categories, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(title, description, categoryId || null, difficulty);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Habit</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty (1-5 stars)</label>
            <StarSelector value={difficulty} onChange={setDifficulty} />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// TODOS PAGE
// ============================================
function TodosPage({ todos, categories, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="items-grid">
        {todos.length === 0 && (
          <div className="empty-state">
            No todos yet. Click the + button to create your first todo.
          </div>
        )}

        {todos.map((todo) => {
          const category = categories.find((c) => c.id === todo.category_id);

          return (
            <div key={todo.id} className="item-card">
              <div className="item-info">
                <h3>{todo.title}</h3>

                <div className="item-meta">
                  {category && (
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: category.color + '20',
                        color: category.color,
                        border: `1px solid ${category.color}`
                      }}
                    >
                      {category.name}
                    </span>
                  )}
                  {todo.difficulty && <Stars count={todo.difficulty} />}
                </div>

                {todo.description && (
                  <p className="item-description">{todo.description}</p>
                )}
              </div>

              <div className="item-actions">
                <button
                  className="icon-btn"
                  onClick={() => onDelete(todo.id)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="add-btn" onClick={() => setShowModal(true)}>
        +
      </button>
      {showModal && (
        <TodoModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={onAdd}
        />
      )}
    </>
  );
}

function TodoModal({ categories, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(title, description, categoryId || null, difficulty);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Todo</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty (1-5 stars)</label>
            <StarSelector value={difficulty} onChange={setDifficulty} />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

