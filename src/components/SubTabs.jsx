export default function SubTabs({ subview, setSubview }) {
    const tabs = [
      { id: 'run', label: 'Run' },
      { id: 'results', label: 'Results' },
      { id: 'explanation', label: 'Explanation' }
    ];
  
    return (
      <section className="subtabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`subtab ${subview === tab.id ? 'active' : ''}`}
            onClick={() => setSubview(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>
    );
  }
  