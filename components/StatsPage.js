function StatsPage({ habits, todos, completions, categories }) {
  const [days, setDays] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState('all');

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

    return { completed, total: numDays };
  };

  // Get habit completion dates for the dot display
  const getHabitCompletionDates = (habitId, numDays) => {
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = completions.some(c => c.item_id === habitId && c.item_type === 'habit' && c.date === dateStr);
      dates.push({ date: dateStr, completed: isCompleted });
    }
    return dates;
  };

  // Filter habits by selected category
  const filteredHabits = selectedCategory === 'all'
    ? habits
    : habits.filter(h => h.category_id === selectedCategory);

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
      <div className="stats-controls">
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

        <select
          className="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <h2>Habit Stats</h2>
      <div className="stats-grid">
        {filteredHabits.length === 0 && (
          <div className="empty-state">
            {selectedCategory === 'all' 
              ? 'No habits to show stats for.' 
              : 'No habits in this category.'}
          </div>
        )}
        {filteredHabits.map(habit => {
          const { completed, total } = getHabitStats(habit.id, days);
          const percentage = Math.round((completed / total) * 100);
          const category = habit.category_id 
            ? categories.find(c => c.id === habit.category_id) 
            : null;
          const completionDates = getHabitCompletionDates(habit.id, days);

          return (
            <div key={habit.id} className="stat-card habit-stat-card">
              <h3>{habit.title}</h3>
              {category && (
                <span
                  className="category-badge"
                  style={{
                    backgroundColor: category.color + '20',
                    color: category.color,
                    border: `1px solid ${category.color}`,
                    fontSize: '0.85rem',
                    marginBottom: '1rem'
                  }}
                >
                  {category.name}
                </span>
              )}
              
              {/* Circle Chart */}
              <div className="habit-circle-chart">
                <svg viewBox="0 0 120 120" className="circle-svg">
                  <circle cx="60" cy="60" r="50" className="circle-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="circle-fill"
                    style={{
                      strokeDasharray: `${(percentage / 100) * 314} 314`,
                      stroke: category ? category.color : 'var(--accent)'
                    }}
                  />
                </svg>
                <div className="circle-text">
                  <div className="circle-percentage">{percentage}%</div>
                  <div className="circle-label">{completed}/{total} days</div>
                </div>
              </div>

              {/* Completion Dots */}
              <div className="completion-dots">
                {completionDates.map(({ date, completed: isCompleted }, idx) => (
                  <div
                    key={idx}
                    className={`dot ${isCompleted ? 'completed' : 'empty'}`}
                    style={isCompleted && category ? { backgroundColor: category.color } : {}}
                    title={new Date(date + 'T00:00:00').toLocaleDateString()}
                  />
                ))}
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