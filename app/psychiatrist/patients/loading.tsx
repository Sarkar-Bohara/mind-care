export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Patient Overview Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex space-x-4 mt-2">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}