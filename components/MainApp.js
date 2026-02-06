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

  const editCategory = async (name, color, id) => {
    const encryptedName = await encryption.encrypt(name, encryptionKey);
    const { error } = await supabase
      .from('categories')
      .update({ name: encryptedName, color })
      .eq('id', id);

    if (!error) {
      setCategories(categories.map((c) => 
        c.id === id ? { ...c, name, color } : c
      ));
    }
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

  const editHabit = async (title, description, categoryId, difficulty, id) => {
    const encryptedTitle = await encryption.encrypt(title, encryptionKey);
    const encryptedDescription = description
      ? await encryption.encrypt(description, encryptionKey)
      : null;

    const { error } = await supabase
      .from('habits')
      .update({
        title: encryptedTitle,
        description: encryptedDescription,
        category_id: categoryId || null,
        difficulty
      })
      .eq('id', id);

    if (!error) {
      setHabits(habits.map((h) => 
        h.id === id ? { ...h, title, description, category_id: categoryId || null, difficulty } : h
      ));
    }
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

  const editTodo = async (title, description, categoryId, difficulty, id) => {
    const encryptedTitle = await encryption.encrypt(title, encryptionKey);
    const encryptedDescription = description
      ? await encryption.encrypt(description, encryptionKey)
      : null;

    const { error } = await supabase
      .from('todos')
      .update({
        title: encryptedTitle,
        description: encryptedDescription,
        category_id: categoryId || null,
        difficulty
      })
      .eq('id', id);

    if (!error) {
      setTodos(todos.map((t) => 
        t.id === id ? { ...t, title, description, category_id: categoryId || null, difficulty } : t
      ));
    }
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
          onEdit={editCategory}
        />
      )}
      {page === 'habits' && (
        <HabitsPage
          habits={habits}
          categories={categories}
          onAdd={addHabit}
          onDelete={deleteHabit}
          onEdit={editHabit}
        />
      )}
      {page === 'todos' && (
        <TodosPage
          todos={todos}
          categories={categories}
          onAdd={addTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
        />
      )}
      {page === 'calendar' && (
        <CalendarPage
          habits={habits}
          todos={todos}
          completions={completions}
          onToggle={toggleCompletion}
        />
      )}
      {page === 'stats' && (
        <StatsPage
          habits={habits}
          todos={todos}
          completions={completions}
          categories={categories}
        />
      )}
    </div>
  );
}