import leaderboardBg from '../photo/Leaderboard.jpg'

export default function Leaderboard() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
      style={{ backgroundImage: `url(${leaderboardBg})` }}
    >
      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center">
    
        <p className="text-gray-200 mt-4 text-lg">"Where every trade writes history"</p>
        <p className="text-gray-300 mt-2 text-sm">Coming Soon...</p>
      </div>
    </div>
  )
}