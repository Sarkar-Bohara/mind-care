export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Posts Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-16 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
