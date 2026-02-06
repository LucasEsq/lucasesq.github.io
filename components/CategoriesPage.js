function CategoryModal({ onClose, onSave, editingCategory = null }) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [color, setColor] = useState(editingCategory?.color || '#8b5a3c');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name, color, editingCategory?.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
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
              {editingCategory ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Alternative using the reusable FormModal component
function CategoryModalReusable({ onClose, onSave, editingCategory = null }) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [color, setColor] = useState(editingCategory?.color || '#8b5a3c');

  const handleSubmit = () => {
    onSave(name, color, editingCategory?.id);
  };

  return (
    <FormModal
      title={editingCategory ? 'Edit Category' : 'New Category'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={editingCategory ? 'Save' : 'Create'}
    >
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
    </FormModal>
  );
}

function CategoriesPage({ categories, onAdd, onDelete, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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
                <buttonicon-btn"
                  onClick={() => {
                    setEditingCategory(category);
                    setShowModal(true);
                  }}
                  title="Edit category"
                  style={{ padding: '0 0.5rem' }}
                >
                  ✏
                </button>
                <button
                  className="
                  className="delete-category"{
        setEditingCategory(null);
        setShowModal(true);
      }}>
        +
      </button>
      {showModal && (
        <CategoryModal
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
          onSave={editingCategory ? onEdit : onAdd}
          editingCategory={editingCategory
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