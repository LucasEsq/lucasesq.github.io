function DayView({ date, habits, todos, completions, onToggle }) {
  const dateStr = date.toISOString().split('T')[0];
  const dateDisplay = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const isCompleted = (itemId, itemType) => {
    return completions.some(
      c => c.item_id === itemId && c.item_type === itemType && c.date === dateStr
    );
  };

  // Filter todos: show uncompleted todos on all days, or todos completed on this date
  const todosForDay = todos.filter(todo => {
    const isCompletedAnyDay = completions.some(c => c.item_id === todo.id && c.item_type === 'todo');
    if (!isCompletedAnyDay) {
      // Not completed yet, show on all days
      return true;
    }
    // Completed on some day, only show on that day
    return completions.some(c => c.item_id === todo.id && c.item_type === 'todo' && c.date === dateStr);
  });

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h3>{dateDisplay}</h3>
      </div>

      {habits.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--muted)' }}>
            Habits
          </h3>
          {habits.map(habit => (
            <div key={habit.id} className="toggle-item">
              <div>
                <div style={{ fontWeight: '500' }}>{habit.title}</div>
                {habit.description && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {habit.description}
                  </div>
                )}
              </div>
              <div 
                className={`checkbox ${isCompleted(habit.id, 'habit') ? 'checked' : ''}`}
                onClick={() => onToggle(habit.id, 'habit', date)}
              />
            </div>
          ))}
        </>
      )}

      {todosForDay.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--muted)' }}>
            Todos
          </h3>
          {todosForDay.map(todo => (
            <div key={todo.id} className="toggle-item">
              <div>
                <div style={{ fontWeight: '500' }}>{todo.title}</div>
                {todo.description && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {todo.description}
                  </div>
                )}
              </div>
              <div 
                className={`checkbox ${isCompleted(todo.id, 'todo') ? 'checked' : ''}`}
                onClick={() => onToggle(todo.id, 'todo', date)}
              />
            </div>
          ))}
        </>
      )}

      {habits.length === 0 && todosForDay.length === 0 && (
        <div className="empty-state">
          Create some habits or todos to track them here.
        </div>
      )}
    </div>
  );
}

function CalendarPage({ habits, todos, completions, onToggle }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getCompletedCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return completions.filter(c => c.date === dateStr).length;
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{monthYear}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            ←
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            →
          </button>
        </div>
      </div>

      <div className="calendar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-header">{day}</div>
        ))}
        {days.map((day, idx) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const habitCompletions = completions.filter(c => 
            c.item_type === 'habit' && c.date === dateStr
          ).length;
          const totalHabits = habits.length;
          return (
            <div
              key={idx}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected(day.date) ? 'selected' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="day-number">{day.date.getDate()}</div>
              {habitCompletions > 0 && (
                <div className="day-indicator">{habitCompletions}/{totalHabits}</div>
              )}
            </div>
          );
        })}
      </div>

      <DayView 
        date={selectedDate}
        habits={habits}
        todos={todos}
        completions={completions}
        onToggle={onToggle}
      />
    </>
  );
}