function HabitModal({ categories, onClose, onSave, editingHabit = null }) {
  const [title, setTitle] = useState(editingHabit?.title || '');
  const [description, setDescription] = useState(editingHabit?.description || '');
  const [categoryId, setCategoryId] = useState(editingHabit?.category_id || '');
  const [difficulty, setDifficulty] = useState(editingHabit?.difficulty || 3);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    try {
      const success = await onSave(title, description, categoryId || null, difficulty, editingHabit?.id);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      title={editingHabit ? 'Edit Habit' : 'New Habit'}
      onClose={onClose}
      onSubmit={handleSave}
      submitText={editingHabit ? 'Save' : 'Create'}
      error={error}
    >
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={loading}
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
        <StarSelector value={difficulty} onChange={setDifficulty} disabled={loading} />
      </div>

      <div className="form-group">
        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>
    </FormModal>
  );
}

function HabitsPage({ habits, categories, completions = [], completionWindowDays, onAdd, onDelete, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortDifficulty, setSortDifficulty] = useState('none'); // 'none', 'asc', 'desc'
  const [openDropdown, setOpenDropdown] = useState(null);
  const windowDays = typeof completionWindowDays === 'number'
    ? completionWindowDays
    : (window.CONSTANTS?.HABIT_DOT_WINDOW_DAYS || 7);

  const getHabitCompletionDates = (habitId, numDays) => {
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = completions.some(
        (c) => c.item_id === habitId && c.item_type === 'habit' && c.date === dateStr
      );
      dates.push({ date: dateStr, completed: isCompleted });
    }
    return dates;
  };

  // Filter and sort habits
  let filteredHabits = habits.filter(habit => {
    // Category filter
    if (filterCategory && habit.category_id !== filterCategory) {
      return false;
    }
    return true;
  });

  // Sort habits
  if (sortDifficulty !== 'none') {
    filteredHabits.sort((a, b) => {
      const diffA = a.difficulty || 0;
      const diffB = b.difficulty || 0;
      return sortDifficulty === 'asc' ? diffA - diffB : diffB - diffA;
    });
  }

  return (
    <>
      <div className="filter-controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '0.5rem' }}>Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginRight: '0.5rem' }}>Sort by difficulty:</label>
          <select
            value={sortDifficulty}
            onChange={(e) => setSortDifficulty(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="none">None</option>
            <option value="asc">Increasing</option>
            <option value="desc">Decreasing</option>
          </select>
        </div>
      </div>

      <div className="items-grid">
        {filteredHabits.length === 0 && (
          <div className="empty-state">
            {habits.length === 0 ? 'No habits yet. Click the + button to create your first habit.' : 'No habits match the selected filters.'}
          </div>
        )}

        {filteredHabits.map((habit) => {
          const category = categories.find((c) => c.id === habit.category_id);
          const isDropdownOpen = openDropdown === habit.id;
          const completionDates = getHabitCompletionDates(habit.id, windowDays);

          return (
            <div key={habit.id} className="item-card">
              <div className="item-info">
                <h3 className="item-title">{habit.title}</h3>
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
                <div className="completion-dots compact">
                  {completionDates.map(({ date, completed: isCompleted }, idx) => (
                    <div
                      key={idx}
                      className={`dot ${isCompleted ? 'completed' : 'empty'}`}
                      style={isCompleted && category ? { backgroundColor: category.color, borderColor: category.color } : {}}
                      title={new Date(date + 'T00:00:00').toLocaleDateString()}
                    />
                  ))}
                </div>
                {habit.description && (
                  <p className="item-description">{habit.description}</p>
                )}
              </div>

              <div className="item-actions-dropdown">
                <button
                  className="icon-btn menu-toggle"
                  onClick={() => setOpenDropdown(isDropdownOpen ? null : habit.id)}
                  title="Actions"
                >
                  ⋮
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setEditingHabit(habit);
                        setShowModal(true);
                        setOpenDropdown(null);
                      }}
                    >
                      ✏ Edit
                    </button>
                    <button
                      className="dropdown-item danger"
                      onClick={() => {
                        onDelete(habit.id);
                        setOpenDropdown(null);
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className="add-btn" onClick={() => {
        setEditingHabit(null);
        setShowModal(true);
      }}>
        +
      </button>
      {showModal && (
        <HabitModal
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingHabit(null);
          }}
          onSave={editingHabit ? onEdit : onAdd}
          editingHabit={editingHabit}
        />
      )}
    </>
  );
}