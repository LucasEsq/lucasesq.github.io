function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Reusable form modal component
function FormModal({ title, onClose, onSubmit, children, submitText = "Save", error = null }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
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
          {children}
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn">
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}