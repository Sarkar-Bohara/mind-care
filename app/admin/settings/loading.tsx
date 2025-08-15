export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Settings Cards Skeleton */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

          <div className="space-y-4">
            {/* Form Fields Skeleton */}
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Toggle Switches Skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}

      {/* System Status Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
