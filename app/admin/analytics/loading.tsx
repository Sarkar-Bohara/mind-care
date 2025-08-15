export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Key Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
