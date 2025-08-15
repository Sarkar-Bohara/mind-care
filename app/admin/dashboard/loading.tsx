export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
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
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* 3D Analytics Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="h-96 w-full bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Alerts Skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent User Activity Skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
