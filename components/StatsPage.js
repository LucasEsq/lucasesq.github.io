function StatsPage({ habits, todos, completions, categories }) {
  const [days, setDays] = useState(7);

  const getHabitStats = (habitId, numDays) => {
    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const completed = dates.filter(date =>
      completions.some(c => c.item_id === habitId && c.item_type === 'habit' && c.date === date)
    ).length;

    return Math.round((completed / numDays) * 100);
  };

  const getTodoCompletionsByDay = () => {
    const byDay = {};
    completions
      .filter(c => c.item_type === 'todo')
      .forEach(c => {
        if (!byDay[c.date]) byDay[c.date] = 0;
        byDay[c.date]++;
      });

    return Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30);
  };

  const getStarsByCategoryByDay = () => {
    const byDayAndCategory = {};

    completions.forEach(completion => {
      // Find the item (habit or todo)
      const item = completion.item_type === 'habit'
        ? habits.find(h => h.id === completion.item_id)
        : todos.find(t => t.id === completion.item_id);

      if (!item || !item.category_id || !item.difficulty) return;

      const date = completion.date;
      if (!byDayAndCategory[date]) {
        byDayAndCategory[date] = {};
      }

      if (!byDayAndCategory[date][item.category_id]) {
        byDayAndCategory[date][item.category_id] = 0;
      }

      byDayAndCategory[date][item.category_id] += item.difficulty;
    });

    return byDayAndCategory;
  };

  const starsByDayAndCategory = getStarsByCategoryByDay();
  const todosByDay = getTodoCompletionsByDay();

  // Get sorted dates for display
  const sortedDates = Object.keys(starsByDayAndCategory)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 10);

  return (
    <>
      <div className="day-selector">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            className={`day-btn ${days === d ? 'active' : ''}`}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      <h2>Habit Completion Rates</h2>
      <div className="stats-grid">
        {habits.length === 0 && (
          <div className="empty-state">No habits to show stats for.</div>
        )}
        {habits.map(habit => {
          const percentage = getHabitStats(habit.id, days);
          return (
            <div key={habit.id} className="stat-card">
              <h3>{habit.title}</h3>
              <div className="stat-value">{percentage}%</div>
              <div className="stat-label">completed in last {days} days</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: '3rem' }}>Stars by Category</h2>
      <div className="stats-grid">
        {sortedDates.length === 0 && (
          <div className="empty-state">No completed items with categories yet.</div>
        )}
        {sortedDates.map(date => {
          const categoryStats = starsByDayAndCategory[date];
          
          return (
            <div key={date} className="stat-card">
              <div className="stat-label" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              
              {Object.entries(categoryStats).map(([categoryId, stars]) => {
                const category = categories.find(c => c.id === categoryId);
                if (!category) return null;
                
                return (
                  <div key={categoryId} style={{ marginBottom: '0.5rem' }}>
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: category.color + '20',
                        color: category.color,
                        border: `1px solid ${category.color}`,
                        marginRight: '0.5rem'
                      }}
                    >
                      {category.name}
                    </span>
                    <Stars count={stars} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: '3rem' }}>Todo Completions</h2>
      <div className="stats-grid">
        {todosByDay.length === 0 && (
          <div className="empty-state">No completed todos yet.</div>
        )}
        {todosByDay.slice(0, 10).map(([date, count]) => (
          <div key={date} className="stat-card">
            <div className="stat-label">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="stat-value">{count}</div>
            <div className="stat-label">todos completed</div>
          </div>
        ))}
      </div>
    </>
  );
}