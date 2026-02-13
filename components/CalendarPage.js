function TimeSpentModal({ itemTitle, itemType, date, category, difficulty, onClose, onSave }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState(null);
  const quickOptions = [5, 10, 15, 25, 45, 60];

  const normalizeTime = () => {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalMinutes = h * 60 + m;
    const normalizedHours = Math.floor(totalMinutes / 60);
    const normalizedMinutes = totalMinutes % 60;
    setHours(normalizedHours > 0 ? String(normalizedHours) : '');
    setMinutes(normalizedMinutes > 0 ? String(normalizedMinutes) : '');
  };

  const dateText = date
    ? date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : '';
  const stars = Number.isFinite(difficulty) ? difficulty : null;
  const categoryName = category?.name || '';
  const subtitle = stars
    ? (categoryName
      ? `You collected ${stars} stars in the category of ${categoryName}.`
      : `You collected ${stars} stars.`)
    : 'Log how much time you spent.';

  const handleSubmit = () => {
    setError(null);
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalMinutes = h * 60 + m;
    if (totalMinutes < 0) {
      setError('Enter time in hours and/or minutes.');
      return;
    }
    if (totalMinutes === 0) {
      setError('Enter at least 1 minute.');
      return;
    }
    onSave(totalMinutes);
  };

  return (
    <FormModal
      title="Finished!"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Save"
      error={error}
    >
      <div className="completion-modal">
        <div className="completion-subtitle">{subtitle}</div>
        {(categoryName || stars) && (
          <div className="completion-meta">
            {categoryName && (
              <span
                className="category-badge"
                style={{
                  backgroundColor: category?.color ? category.color + '20' : 'transparent',
                  color: category?.color || 'var(--fg)',
                  border: category?.color ? `1px solid ${category.color}` : '1px solid var(--border)'
                }}
              >
                {categoryName}
              </span>
            )}
            {stars && (
              <span className="completion-stars">
                <Stars count={stars} />
              </span>
            )}
          </div>
        )}
      </div>
      <div className="form-group">
        <label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Task</label>
        <div style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
          {itemTitle || 'Selected task'}{itemType ? ` (${itemType})` : ''}
        </div>
      </div>

      <div className="form-group">
        <label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Date</label>
        <div style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
          {dateText}
        </div>
      </div>

      <div className="form-group">
        <label>Time spent</label>
        <div className="time-input-group">
          <div className="time-input-pair">
            <input
              type="number"
              min="0"
              step="1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onBlur={normalizeTime}
              className="time-input"
            />
            <span className="time-input-label">hours</span>
          </div>
          <div className="time-input-pair">
            <input
              type="number"
              min="0"
              max="59"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onBlur={normalizeTime}
              autoFocus
              className="time-input"
            />
            <span className="time-input-label">minutes</span>
          </div>
        </div>
        <div className="time-presets">
          {quickOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`time-preset-btn ${String(option) === minutes ? 'active' : ''}`}
              onClick={() => setMinutes(String(option))}
            >
              {option}m
            </button>
          ))}
        </div>
      </div>
    </FormModal>
  );
}

function DayView({ date, habits, todos, categories, completions, onToggleRequest }) {
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
  const habitDotWindowDays = (() => {
    if (typeof window === 'undefined') {
      return 7;
    }
    const storageKey = window.CONSTANTS?.STORAGE_KEYS?.HABIT_DOT_WINDOW || 'habit_dot_window';
    const storedValue = Number(localStorage.getItem(storageKey));
    if (!Number.isNaN(storedValue) && storedValue > 0) {
      return storedValue;
    }
    return window.CONSTANTS?.HABIT_DOT_WINDOW_DAYS || 7;
  })();

  const isCompleted = (itemId, itemType) => {
    return completions.some(
      c => c.item_id === itemId && c.item_type === itemType && c.date === dateStr
    );
  };

  const isTodoCompletedAnyDay = (todoId) => {
    return completions.some(c => c.item_id === todoId && c.item_type === 'todo');
  };

  const getHabitCompletionDates = (habitId, numDays) => {
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const dotDate = new Date(date);
      dotDate.setDate(dotDate.getDate() - i);
      const dotDateStr = dotDate.toISOString().split('T')[0];
      const completed = completions.some(
        (c) => c.item_id === habitId && c.item_type === 'habit' && c.date === dotDateStr
      );
      dates.push({ date: dotDateStr, completed });
    }
    return dates;
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
    const completed = isCompleted(item.id, itemType);
    const habitCompletionDates = itemType === 'habit'
      ? getHabitCompletionDates(item.id, habitDotWindowDays)
      : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <div className="item-title" style={{ fontWeight: '500' }}>{item.title}</div>
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
          {itemType === 'todo' && (
            <span className={`status-pill ${completed ? 'done' : 'not-done'}`}>
              {completed ? 'Done' : 'Not done'}
            </span>
          )}
        </div>
        {itemType === 'habit' && (
          <div className="completion-dots compact">
            {habitCompletionDates.map(({ date: dotDate, completed: isCompleted }, idx) => (
              <div
                key={idx}
                className={`dot ${isCompleted ? 'completed' : 'empty'}`}
                style={isCompleted && category ? { backgroundColor: category.color, borderColor: category.color } : {}}
                title={new Date(dotDate + 'T00:00:00').toLocaleDateString()}
              />
            ))}
          </div>
        )}
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
                  onClick={() => onToggleRequest(
                    habit.id,
                    'habit',
                    date,
                    isCompleted(habit.id, 'habit'),
                      habit.title,
                      categories.find((c) => c.id === habit.category_id) || null,
                      habit.difficulty
                  )}
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
              <div key={todo.id} className={`toggle-item ${isCompleted(todo.id, 'todo') ? 'completed' : ''}`}>
                {renderItemWithMeta(todo, 'todo')}
                <div 
                  className={`checkbox ${isCompleted(todo.id, 'todo') ? 'checked' : ''}`}
                  onClick={() => onToggleRequest(
                    todo.id,
                    'todo',
                    date,
                    isCompleted(todo.id, 'todo'),
                      todo.title,
                      categories.find((c) => c.id === todo.category_id) || null,
                      todo.difficulty
                  )}
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
  const [pendingCompletion, setPendingCompletion] = useState(null);

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

  const handleToggleRequest = (itemId, itemType, date, isCompleted, itemTitle, category, difficulty) => {
    if (isCompleted) {
      onToggle(itemId, itemType, date);
      return;
    }
    setPendingCompletion({
      itemId,
      itemType,
      date,
      itemTitle,
      category,
      difficulty
    });
  };

  const handleSaveTimeSpent = (minutes) => {
    if (!pendingCompletion) {
      return;
    }
    onToggle(
      pendingCompletion.itemId,
      pendingCompletion.itemType,
      pendingCompletion.date,
      minutes
    );
    setPendingCompletion(null);
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
        onToggleRequest={handleToggleRequest}
      />
      {pendingCompletion && (
        <TimeSpentModal
          itemTitle={pendingCompletion.itemTitle}
          itemType={pendingCompletion.itemType}
          date={pendingCompletion.date}
          category={pendingCompletion.category}
          difficulty={pendingCompletion.difficulty}
          onClose={() => setPendingCompletion(null)}
          onSave={handleSaveTimeSpent}
        />
      )}
    </>
  );
}