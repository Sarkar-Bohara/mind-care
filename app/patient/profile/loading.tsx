export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      {/* Profile Card Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Cards */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
