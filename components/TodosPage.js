function TodoModal({ categories, onClose, onSave, editingTodo = null }) {
  const [title, setTitle] = useState(editingTodo?.title || '');
  const [description, setDescription] = useState(editingTodo?.description || '');
  const [categoryId, setCategoryId] = useState(editingTodo?.category_id || '');
  const [difficulty, setDifficulty] = useState(editingTodo?.difficulty || 3);
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
      const success = await onSave(title, description, categoryId || null, difficulty, editingTodo?.id);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save todo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      title={editingTodo ? 'Edit Todo' : 'New Todo'}
      onClose={onClose}
      onSubmit={handleSave}
      submitText={editingTodo ? 'Save' : 'Create'}
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

function TodosPage({ todos, categories, completions, onAdd, onDelete, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'done', 'not-done'
  const [sortDifficulty, setSortDifficulty] = useState('none'); // 'none', 'asc', 'desc'
  const [openDropdown, setOpenDropdown] = useState(null);

  // Check if a todo is completed
  const isTodoCompleted = (todoId) => {
    return completions.some(c => c.item_id === todoId && c.item_type === 'todo');
  };

  // Filter and sort todos
  let filteredTodos = todos.filter(todo => {
    // Category filter
    if (filterCategory && todo.category_id !== filterCategory) {
      return false;
    }

    // Status filter
    if (filterStatus === 'done' && !isTodoCompleted(todo.id)) {
      return false;
    }
    if (filterStatus === 'not-done' && isTodoCompleted(todo.id)) {
      return false;
    }

    return true;
  });

  // Sort todos
  if (sortDifficulty !== 'none') {
    filteredTodos.sort((a, b) => {
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
          <label style={{ marginRight: '0.5rem' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="all">All</option>
            <option value="not-done">Not done</option>
            <option value="done">Done</option>
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
        {filteredTodos.length === 0 && (
          <div className="empty-state">
            {todos.length === 0 ? 'No todos yet. Click the + button to create your first todo.' : 'No todos match the selected filters.'}
          </div>
        )}

        {filteredTodos.map((todo) => {
          const category = categories.find((c) => c.id === todo.category_id);
          const isDropdownOpen = openDropdown === todo.id;
          const isCompleted = isTodoCompleted(todo.id);

          return (
            <div key={todo.id} className={`item-card ${isCompleted ? 'item-card-completed' : ''}`}>
              <div className="item-info">
                <h3 className="item-title">{todo.title}</h3>
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
                  <span className={`status-pill ${isCompleted ? 'done' : 'not-done'}`}>
                    {isCompleted ? 'Done' : 'Not done'}
                  </span>
                </div>
                {todo.description && (
                  <p className="item-description">{todo.description}</p>
                )}
              </div>

              <div className="item-actions-dropdown">
                <button
                  className="icon-btn menu-toggle"
                  onClick={() => setOpenDropdown(isDropdownOpen ? null : todo.id)}
                  title="Actions"
                >
                  ⋮
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setEditingTodo(todo);
                        setShowModal(true);
                        setOpenDropdown(null);
                      }}
                    >
                      ✏ Edit
                    </button>
                    <button
                      className="dropdown-item danger"
                      onClick={() => {
                        onDelete(todo.id);
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
        setEditingTodo(null);
        setShowModal(true);
      }}>
        +
      </button>
      {showModal && (
        <TodoModal
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingTodo(null);
          }}
          onSave={editingTodo ? onEdit : onAdd}
          editingTodo={editingTodo}
        />
      )}
    </>
  );
}