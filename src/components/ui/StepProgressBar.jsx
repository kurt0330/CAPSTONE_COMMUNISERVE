// PATH: /src/components/ui/StepProgressBar.jsx
// Replaces the .step-progress-wrapper block from form1.html
// Props:
//   currentStep: number (1-5)
//   completedSteps: number[] (e.g. [1, 2])

const STEPS = [
  { num: 1, label: 'Personal\nInformation' },
  { num: 2, label: 'Professional\nProfile' },
  { num: 3, label: 'Service\nSelection' },
  { num: 4, label: 'Assessment' },
  { num: 5, label: 'File\nAttachment' },
];

export default function StepProgressBar({ currentStep, completedSteps = [] }) {
  return (
    <div className="step-progress-wrapper">
      <div className="main-circle" id="stepCircle">
        {completedSteps.length === 5 ? '✓' : currentStep}
      </div>
      <div className="segmented-bar">
        {STEPS.map(({ num, label }) => {
          const isActive = num === currentStep;
          const isDone   = completedSteps.includes(num);
          const cls = [
            'nav-btn',
            isActive ? 'active' : '',
            isDone   ? 'done'   : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={num}
              type="button"
              className={cls}
              data-step={num}
              // Navigation is controlled by the parent page via SP.go()
              // equivalent — we pass an onClick handler from the parent
            >
              {label.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && label.includes('\n') ? <br /> : ''}</span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}