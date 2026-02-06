console.log("app.js loaded", {
  react: React?.version,
  reactDOM: !!ReactDOM,
  supabase: !!window.supabase,
  secure: window.isSecureContext,
  subtle: !!crypto?.subtle
});

const { useState, useEffect } = React;

// ============================================
// CONFIG - Replace with your Supabase details
// ============================================
const SUPABASE_URL = 'https://hltskzzgbxxhdsdlbfwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdHNrenpnYnh4aGRzZGxiZnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTUwMzgsImV4cCI6MjA4NTk3MTAzOH0.7erP5O69cRhCrGUrAFvaAbw0d_s9pUhV5I4zATPU5sg';

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

// ============================================
// CALENDAR PAGE
// ============================================
function CalendarPage({ habits, todos, completions, onToggle }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getCompletedCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return completions.filter(c => c.date === dateStr).length;
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{monthYear}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            ←
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            →
          </button>
        </div>
      </div>

      <div className="calendar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-header">{day}</div>
        ))}
        {days.map((day, idx) => {
          const completed = getCompletedCount(day.date);
          const total = habits.length + todos.length;
          return (
            <div
              key={idx}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected(day.date) ? 'selected' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="day-number">{day.date.getDate()}</div>
              {completed > 0 && (
                <div className="day-indicator">{completed}/{total}</div>
              )}
            </div>
          );
        })}
      </div>

      <DayView 
        date={selectedDate}
        habits={habits}
        todos={todos}
        completions={completions}
        onToggle={onToggle}
      />
    </>
  );
}

function DayView({ date, habits, todos, completions, onToggle }) {
  const dateStr = date.toISOString().split('T')[0];
  const dateDisplay = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const isCompleted = (itemId, itemType) => {
    return completions.some(
      c => c.item_id === itemId && c.item_type === itemType && c.date === dateStr
    );
  };

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h3>{dateDisplay}</h3>
      </div>

      {habits.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--muted)' }}>
            Habits
          </h3>
          {habits.map(habit => (
            <div key={habit.id} className="toggle-item">
              <div>
                <div style={{ fontWeight: '500' }}>{habit.title}</div>
                {habit.description && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {habit.description}
                  </div>
                )}
              </div>
              <div 
                className={`checkbox ${isCompleted(habit.id, 'habit') ? 'checked' : ''}`}
                onClick={() => onToggle(habit.id, 'habit', date)}
              />
            </div>
          ))}
        </>
      )}

      {todos.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--muted)' }}>
            Todos
          </h3>
          {todos.map(todo => (
            <div key={todo.id} className="toggle-item">
              <div>
                <div style={{ fontWeight: '500' }}>{todo.title}</div>
                {todo.description && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {todo.description}
                  </div>
                )}
              </div>
              <div 
                className={`checkbox ${isCompleted(todo.id, 'todo') ? 'checked' : ''}`}
                onClick={() => onToggle(todo.id, 'todo', date)}
              />
            </div>
          ))}
        </>
      )}

      {habits.length === 0 && todos.length === 0 && (
        <div className="empty-state">
          Create some habits or todos to track them here.
        </div>
      )}
    </div>
  );
}

// ============================================
// STATS PAGE
// ============================================
function StatsPage({ habits, todos, completions }) {
  const [days, setDays] = useState(7);

  const getHabitStats = (habitId, numDays) => {
    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const completed = dates.filter(date =>
      completions.some(c => c.item_id === habitId && c.item_type === 'habit' && c.date === date)
    ).length;

    return Math.round((completed / numDays) * 100);
  };

  const getTodoCompletionsByDay = () => {
    const byDay = {};
    completions
      .filter(c => c.item_type === 'todo')
      .forEach(c => {
        if (!byDay[c.date]) byDay[c.date] = 0;
        byDay[c.date]++;
      });

    return Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30);
  };

  const todosByDay = getTodoCompletionsByDay();

  return (
    <>
      <div className="day-selector">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            className={`day-btn ${days === d ? 'active' : ''}`}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      <h2>Habit Completion Rates</h2>
      <div className="stats-grid">
        {habits.length === 0 && (
          <div className="empty-state">No habits to show stats for.</div>
        )}
        {habits.map(habit => {
          const percentage = getHabitStats(habit.id, days);
          return (
            <div key={habit.id} className="stat-card">
              <h3>{habit.title}</h3>
              <div className="stat-value">{percentage}%</div>
              <div className="stat-label">completed in last {days} days</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: '3rem' }}>Todo Completions</h2>
      <div className="stats-grid">
        {todosByDay.length === 0 && (
          <div className="empty-state">No completed todos yet.</div>
        )}
        {todosByDay.slice(0, 10).map(([date, count]) => (
          <div key={date} className="stat-card">
            <div className="stat-label">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="stat-value">{count}</div>
            <div className="stat-label">todos completed</div>
          </div>
        ))}
      </div>
    </>
  );
}

try {
  const rootEl = document.getElementById("root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
} catch (e) {
  console.error("Fatal render error:", e);
  document.getElementById("root").innerHTML =
    "<pre style='padding:16px;white-space:pre-wrap;color:red'>"
    + e.stack
    + "</pre>";
}

