export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      {/* 3D Progress Overview Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="h-96 w-full bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Search Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Patient Details Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="border rounded-lg p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Notes Skeleton */}
          <div className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
