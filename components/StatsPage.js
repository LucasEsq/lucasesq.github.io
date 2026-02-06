function StatsPage({ habits, todos, completions }) {
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

  const todosByDay = getTodoCompletionsByDay();

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