function DayView({ date, habits, todos, categories, completions, onToggle }) {
  const [habitFilterCategory, setHabitFilterCategory] = useState('');
  const [habitFilterStatus, setHabitFilterStatus] = useState('all');
  const [habitSortDifficulty, setHabitSortDifficulty] = useState('none');
  const [todoFilterCategory, setTodoFilterCategory] = useState('');
  const [todoFilterStatus, setTodoFilterStatus] = useState('all');
  const [todoSortDifficulty, setTodoSortDifficulty] = useState('none');

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

  const isTodoCompletedAnyDay = (todoId) => {
    return completions.some(c => c.item_id === todoId && c.item_type === 'todo');
  };

  // Filter and sort habits
  let habitsForDay = habits.filter(habit => {
    if (habitFilterCategory && habit.category_id !== habitFilterCategory) {
      return false;
    }

    if (habitFilterStatus === 'done' && !isCompleted(habit.id, 'habit')) {
      return false;
    }
    if (habitFilterStatus === 'not-done' && isCompleted(habit.id, 'habit')) {
      return false;
    }

    return true;
  });

  if (habitSortDifficulty !== 'none') {
    habitsForDay.sort((a, b) => {
      const diffA = a.difficulty || 0;
      const diffB = b.difficulty || 0;
      return habitSortDifficulty === 'asc' ? diffA - diffB : diffB - diffA;
    });
  }

  // Filter and sort todos: show uncompleted todos on all days, or todos completed on this date
  let todosForDay = todos.filter(todo => {
    if (todoFilterCategory && todo.category_id !== todoFilterCategory) {
      return false;
    }

    if (todoFilterStatus === 'done' && !isCompleted(todo.id, 'todo')) {
      return false;
    }
    if (todoFilterStatus === 'not-done' && isCompleted(todo.id, 'todo')) {
      return false;
    }

    const isCompletedAnyDay = isTodoCompletedAnyDay(todo.id);
    if (!isCompletedAnyDay) {
      return true;
    }
    return isCompleted(todo.id, 'todo');
  });

  if (todoSortDifficulty !== 'none') {
    todosForDay.sort((a, b) => {
      const diffA = a.difficulty || 0;
      const diffB = b.difficulty || 0;
      return todoSortDifficulty === 'asc' ? diffA - diffB : diffB - diffA;
    });
  }

  const renderItemWithMeta = (item, itemType) => {
    const category = categories.find((c) => c.id === item.category_id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <div style={{ fontWeight: '500' }}>{item.title}</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {category && (
            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                backgroundColor: category.color + '20',
                color: category.color,
                border: `1px solid ${category.color}`
              }}
            >
              {category.name}
            </span>
          )}
          {item.difficulty && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {'★'.repeat(item.difficulty)}
            </div>
          )}
        </div>
        {item.description && (
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            {item.description}
          </div>
        )}
      </div>
    );
  };

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
          
          <div className="filter-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Category:</label>
              <select
                value={habitFilterCategory}
                onChange={(e) => setHabitFilterCategory(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Status:</label>
              <select
                value={habitFilterStatus}
                onChange={(e) => setHabitFilterStatus(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="all">All</option>
                <option value="not-done">Not done</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Sort:</label>
              <select
                value={habitSortDifficulty}
                onChange={(e) => setHabitSortDifficulty(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="none">None</option>
                <option value="asc">Difficulty ↑</option>
                <option value="desc">Difficulty ↓</option>
              </select>
            </div>
          </div>

          {habitsForDay.length > 0 ? (
            habitsForDay.map(habit => (
              <div key={habit.id} className="toggle-item">
                {renderItemWithMeta(habit, 'habit')}
                <div 
                  className={`checkbox ${isCompleted(habit.id, 'habit') ? 'checked' : ''}`}
                  onClick={() => onToggle(habit.id, 'habit', date)}
                />
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
              No habits match the filters.
            </div>
          )}
        </>
      )}

      {todos.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--muted)' }}>
            Todos
          </h3>

          <div className="filter-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Category:</label>
              <select
                value={todoFilterCategory}
                onChange={(e) => setTodoFilterCategory(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Status:</label>
              <select
                value={todoFilterStatus}
                onChange={(e) => setTodoFilterStatus(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="all">All</option>
                <option value="not-done">Not done</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Sort:</label>
              <select
                value={todoSortDifficulty}
                onChange={(e) => setTodoSortDifficulty(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              >
                <option value="none">None</option>
                <option value="asc">Difficulty ↑</option>
                <option value="desc">Difficulty ↓</option>
              </select>
            </div>
          </div>

          {todosForDay.length > 0 ? (
            todosForDay.map(todo => (
              <div key={todo.id} className="toggle-item">
                {renderItemWithMeta(todo, 'todo')}
                <div 
                  className={`checkbox ${isCompleted(todo.id, 'todo') ? 'checked' : ''}`}
                  onClick={() => onToggle(todo.id, 'todo', date)}
                />
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
              No todos match the filters.
            </div>
          )}
        </>
      )}

      {habits.length === 0 && todos.length === 0 && (
        <div className="empty-state">
          Create some habits or todos to track them here.
        </div>
      )}
    </div>
  );
}

function CalendarPage({ habits, todos, categories, completions, onToggle }) {
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
        categories={categories}
        completions={completions}
        onToggle={onToggle}
      />
    </>
  );
}