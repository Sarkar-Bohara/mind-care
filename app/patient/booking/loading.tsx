export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>

              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="border rounded-lg p-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
