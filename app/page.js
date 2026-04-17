export default function HomePage() {
  const navIcons = ["▣", "◔", "⌂", "◎", "☻", "✓", "◫", "◌", "◍"];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

  return (
    <main className="planner-bg">
      <section className="planner-shell">
        <aside className="planner-rail">
          <button className="rail-home" type="button">◫</button>
          <ul>
            {navIcons.map((icon, idx) => (
              <li key={`${icon}-${idx}`}>
                <button className={`rail-icon ${idx === 4 ? "active" : ""}`} type="button">{icon}</button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="planner-main">
          <header className="planner-topbar">
            <p>Floor <strong>Main</strong> ⚲ ⚙</p>
          </header>

          <section className="planner-grid">
            <div className="panel planner-left">
              <h2>Planner</h2>
              <div className="planner-list">
                <button type="button" className="planner-row selected"><span>⏻ Unplanned</span><b>2</b></button>
                <button type="button" className="planner-row"><span>◯ Planned</span></button>
                <button type="button" className="planner-row"><span>◫ All</span></button>
              </div>

              <article className="clock-card">
                <div className="analog-face" aria-hidden="true">
                  <span className="hand hand-hour" />
                  <span className="hand hand-minute" />
                  <span className="hand hand-second" />
                  <span className="pivot" />
                </div>
                <div>
                  <p className="time">4pm</p>
                  <p className="date">Wed, 17th July</p>
                </div>
              </article>

              <section className="calendar-card">
                <div className="calendar-head">
                  <h3>July 2024</h3>
                  <p>‹ ›</p>
                </div>
                <div className="calendar-grid labels">
                  {weekDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="calendar-grid days">
                  {days.map((day) => (
                    <span key={day} className={day === 17 ? "day active" : day === 19 ? "day muted" : "day"}>{day}</span>
                  ))}
                </div>
              </section>
            </div>

            <div className="panel planner-right">
              <h2>Todo's</h2>
              <div className="todo-header">☰ ToDo <strong>Unplanned</strong></div>
              <div className="todo-input">＋ Add todo, press <kbd>↵</kbd> ENTER to save</div>

              <div className="todo-group">
                <p className="group-title">⌃ Unplanned <b>2</b></p>
                <div className="todo-item"><span>◉ HI-1</span><span>HI-1</span></div>
              </div>

              <div className="todo-group">
                <p className="group-title">Without Project</p>
                <div className="todo-item"><span>◉ HI-1</span><span>HI-1</span></div>
              </div>

              <p className="group-title">⌄ Todo's <b>0</b></p>
              <p className="group-title">⌄ Scheduled <b>0</b></p>
              <p className="group-title">⌄ Done <b>0</b></p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
