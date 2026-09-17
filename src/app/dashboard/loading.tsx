export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-10 w-16 bg-gray-200 rounded"></div>
                <div className="h-12 flex-1 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}
