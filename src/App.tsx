export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">PWHL Fantasy League</h1>

        <div className="space-x-6 text-sm">
          <a href="#" className="hover:text-blue-300">Home</a>
          <a href="#" className="hover:text-blue-300">Standings</a>
          <a href="#" className="hover:text-blue-300">Teams</a>
          <a href="#" className="hover:text-blue-300">Players</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-grow text-center px-6">
        <h2 className="text-5xl font-bold text-slate-800 mb-4">
          Welcome to PWHL Fantasy
        </h2>

        <p className="text-lg text-slate-600 max-w-xl mb-8">
          Manage your roster, compete with friends, and follow the
          Professional Women's Hockey League all season long.
        </p>

        <div className="space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
            View Standings
          </button>

          <button className="bg-white border border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-lg font-semibold">
            Browse Players
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm text-center py-4">
        PWHL Fantasy League
      </footer>

    </div>
  )
}