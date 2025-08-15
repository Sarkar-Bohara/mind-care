export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions List Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Notes Skeleton */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-4">
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
