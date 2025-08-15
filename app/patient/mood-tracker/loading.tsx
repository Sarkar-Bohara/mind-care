export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
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

      {/* Chart Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

        <div className="space-y-6">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="flex space-x-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
