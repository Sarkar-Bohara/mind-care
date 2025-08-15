export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
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

      {/* Search and Filter Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Grid Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-16 w-full bg-gray-200 rounded animate-pulse mb-4"></div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="flex space-x-2">
                <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
