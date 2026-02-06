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