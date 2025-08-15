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
      </div>

      {/* Messages Interface Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List Skeleton */}
        <div className="lg:col-span-1 border rounded-lg">
          <div className="p-6 border-b">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-0">
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area Skeleton */}
        <div className="lg:col-span-2 border rounded-lg">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col h-[450px]">
            {/* Messages Skeleton */}
            <div className="flex-1 p-4 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[70%] p-3 bg-gray-200 rounded-lg animate-pulse">
                    <div className="h-4 w-48 bg-gray-300 rounded mb-2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                      <div className="h-3 w-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Skeleton */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <div className="flex-1 h-[60px] bg-gray-200 rounded animate-pulse"></div>
                <div className="h-[60px] w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}