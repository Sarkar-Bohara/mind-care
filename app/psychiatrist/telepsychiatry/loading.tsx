export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      {/* System Status Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Upcoming Sessions Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>

        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
