export default function TopBar({ dark, onToggleTheme, onOpenCurrent }) {
    return (
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-label="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 17c3.6-5 6.1-7 9-7 2.9 0 5.4 2 9 7"></path>
              <path d="M4 7h4"></path>
              <path d="M10 5h4"></path>
              <path d="M16 7h4"></path>
              <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"></circle>
            </svg>
          </div>
          <div className="title">
            <h1>Thesis Pipeline Walkthrough</h1>
            <p>Modular React UI with notebook + HTML fallback support.</p>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onToggleTheme}>{dark ? 'Light mode' : 'Dark mode'}</button>
          <button className="btn" onClick={onOpenCurrent}>Open current notebook</button>
        </div>
      </header>
    );
  }
  