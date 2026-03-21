import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-headline font-bold">Select a Screen</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/screen1"
          className="p-6 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors shadow-sm"
        >
          <h2 className="text-2xl font-bold mb-2">Screen 1</h2>
          <p className="text-tertiary">Player Profile Page (DYPPY)</p>
        </Link>

        <Link
          to="/screen2"
          className="p-6 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors shadow-sm"
        >
          <h2 className="text-2xl font-bold mb-2">Screen 2</h2>
          <p className="text-tertiary">Federation Platform (The Kinetic Arena)</p>
        </Link>
      </div>
    </div>
  );
}

export default App;
