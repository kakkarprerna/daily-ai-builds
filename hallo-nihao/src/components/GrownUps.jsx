// A short explainer for parents and teachers.
const POINTS = [
  ['🗺️', 'Learn', 'One unit per textbook lesson or unit, opening in the order of the book: a unit unlocks once the one before has a star. Each lesson mixes pictures, listening and matching. Missed questions come back at the end.'],
  ['🏆', 'Quiz Battle', 'Ten timed questions from the units already practised. Faster answers score more, and the podium keeps the top five scores.'],
  ['📖', 'Words', 'Every word with its picture, meaning and a speaker button, for homework checks.'],
  ['🔊', 'Voices', "Words are read by your device's built-in voices. If a device has no Chinese voice, listening questions are skipped for Chinese."],
  ['🔒', 'Privacy', 'No sign-in and no tracking. Progress is saved only in this browser on this device.'],
  ['📚', 'The words', 'German follows Paul, Lisa & Co Starter (Hueber), lesson by lesson, using the words in the publisher’s own lesson tests. Chinese follows the eight units of Kuaile Hanyu 1, with the core words of each lesson topic. Check them against the book pages, as the Chinese list is not copied from the book.'],
];

export default function GrownUps({ onClose }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="For grown-ups" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>For grown-ups</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="modal-lead">A practice app for children starting German or Chinese at school, aged about 6 to 10.</p>
        <ul className="points">
          {POINTS.map(([icon, title, text]) => (
            <li key={title}>
              <span className="pt-icon" aria-hidden="true">{icon}</span>
              <span><b>{title}</b>{text}</span>
            </li>
          ))}
        </ul>
        <button className="btn" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
