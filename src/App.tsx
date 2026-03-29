import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import TeamsPage from './pages/TeamsPage'
import PlayersPage from './pages/PlayersPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import LeaguesPage from './pages/LeaguesPage'
import LeaguePage from './pages/LeaguePage'

type Page = 'home' | 'standings' | 'teams' | 'players' | 'leagues' | 'league' | 'login' | 'signup'

function AppInner() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)

  const navLink = (label: string, target: Page) => (
    <button
      onClick={() => setPage(target)}
      className={`hover:text-blue-300 ${page === target ? 'text-blue-400 font-semibold' : ''}`}
    >
      {label}
    </button>
  )

  function openLeague(id: string) {
    setSelectedLeagueId(id)
    setPage('league')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => setPage('home')}>
          PWHL Fantasy League
        </h1>

        <div className="space-x-6 text-sm flex items-center">
          {navLink('Home', 'home')}
          {navLink('Standings', 'standings')}
          {navLink('Teams', 'teams')}
          {navLink('Players', 'players')}
          {navLink('Leagues', 'leagues')}

          {user ? (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-700">
              <span className="text-slate-400 text-xs">{user.username}</span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white text-xs"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-3 ml-2 pl-4 border-l border-slate-700">
              <button
                onClick={() => setPage('login')}
                className={`hover:text-blue-300 ${page === 'login' ? 'text-blue-400 font-semibold' : ''}`}
              >
                Sign in
              </button>
              <button
                onClick={() => setPage('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-grow">
        {page === 'home' && (
          <section className="flex flex-col items-center justify-center flex-grow text-center px-6 py-24">
            <h2 className="text-5xl font-bold text-slate-800 mb-4">
              Welcome to PWHL Fantasy
            </h2>

            <p className="text-lg text-slate-600 max-w-xl mb-8">
              Manage your roster, compete with friends, and follow the
              Professional Women's Hockey League all season long.
            </p>

            <div className="space-x-4">
              <button
                onClick={() => setPage('leagues')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Browse Leagues
              </button>

              <button
                onClick={() => setPage('players')}
                className="bg-white border border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-lg font-semibold"
              >
                Browse Players
              </button>
            </div>
          </section>
        )}

        {page === 'standings' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Standings</h2>
            <p className="text-slate-500">Coming soon.</p>
          </div>
        )}

        {page === 'teams' && <TeamsPage />}
        {page === 'players' && <PlayersPage />}

        {page === 'leagues' && <LeaguesPage onSelectLeague={openLeague} />}
        {page === 'league' && selectedLeagueId && (
          <LeaguePage leagueId={selectedLeagueId} onBack={() => setPage('leagues')} />
        )}

        {page === 'login' && (
          <LoginPage
            onSuccess={() => setPage('home')}
            onSignup={() => setPage('signup')}
          />
        )}
        {page === 'signup' && (
          <SignupPage
            onSuccess={() => setPage('home')}
            onLogin={() => setPage('login')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm text-center py-4">
        PWHL Fantasy League
      </footer>

    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
