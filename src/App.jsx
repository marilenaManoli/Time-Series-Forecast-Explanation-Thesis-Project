import React, { useMemo, useState } from 'react';
import NotebookWindow from './components/NotebookWindow';
import './styles/app.css';
import { steps } from './data/steps';

export default function App() {
  const [selectedId, setSelectedId] = useState(steps?.[0]?.id || null);

  const selectedStep = useMemo(
    () => steps.find((step) => step.id === selectedId) || steps[0],
    [selectedId]
  );

  return (
    <NotebookWindow
      steps={steps}
      selectedId={selectedStep?.id}
      onSelectStep={setSelectedId}
    />
  );
}