function Stars({ count, max = 5 }) {
  // If count is greater than max, show as "★×count" format
  if (count > max) {
    return (
      <span className="stars">
        <span className="star">★</span>
        <span style={{ marginLeft: '0.25rem', fontWeight: 'bold' }}>×{count}</span>
      </span>
    );
  }

  // Otherwise, show individual stars
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