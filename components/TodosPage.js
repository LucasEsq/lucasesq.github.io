function TodoModal({ categories, onClose, onSave, editingTodo = null }) {
  const [title, setTitle] = useState(editingTodo?.title || '');
  const [description, setDescription] = useState(editingTodo?.description || '');
  const [categoryId, setCategoryId] = useState(editingTodo?.category_id || '');
  const [difficulty, setDifficulty] = useState(editingTodo?.difficulty || 3);

  return (
    <FormModal
      title={editingTodo ? 'Edit Todo' : 'New Todo'}
      onClose={onClose}
      onSubmit={() => onSave(title, description, categoryId || null, difficulty, editingTodo?.id)}
      submitText={editingTodo ? 'Save' : 'Create'}
    >
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
    </FormModal>
  );
}

function TodosPage({ todos, categories, onAdd, onDelete, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

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
                  onClick={() => {
                    setEditingTodo(todo);
                    setShowModal(true);
                  }}
                  title="Edit"
                >
                  ✏
                </button>
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