function Stars({ count, max = 5 }) {
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