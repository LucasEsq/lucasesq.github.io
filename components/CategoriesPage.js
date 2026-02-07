function CategoryModal({ onClose, onSave, editingCategory = null }) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [color, setColor] = useState(editingCategory?.color || '#8b5a3c');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setLoading(true);
    try {
      const success = await onSave(name, color, editingCategory?.id);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
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

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {error && (
            <div className="error-message" style={{ 
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g., Work, Health, Personal"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
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
                <button
                  className="icon-btn"
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

      <button className="add-btn" onClick={() => {
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
          editingCategory={editingCategory}
        />
      )}
    </>
  );
}