function HabitModal({ categories, onClose, onSave, editingHabit = null }) {
  const [title, setTitle] = useState(editingHabit?.title || '');
  const [description, setDescription] = useState(editingHabit?.description || '');
  const [categoryId, setCategoryId] = useState(editingHabit?.category_id || '');
  const [difficulty, setDifficulty] = useState(editingHabit?.difficulty || 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(title, description, categoryId || null, difficulty, editingHabit?.id);
    onClose();
  };

  return (
    <FormModal
      title={editingHabit ? 'Edit Habit' : 'New Habit'}
      onClose={onClose}
      onSubmit={() => onSave(title, description, categoryId || null, difficulty, editingHabit?.id)}
      submitText={editingHabit ? 'Save' : 'Create'}
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

function HabitsPage({ habits, categories, onAdd, onDelete, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

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
                  onClick={() => {
                    setEditingHabit(habit);
                    setShowModal(true);
                  }}
                  title="Edit"
                >
                  ✏
                </button>
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