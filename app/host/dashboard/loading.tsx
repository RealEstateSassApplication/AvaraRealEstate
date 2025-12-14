'use client';

export default function Loading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto p-6 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-48 bg-gray-100 rounded" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-24 bg-gray-200 rounded" />
                        <div className="h-10 w-28 bg-gray-200 rounded" />
                    </div>
                </div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-lg border border-gray-200" />
                    ))}
                </div>

                {/* Tabs skeleton */}
                <div className="h-12 w-full bg-gray-100 rounded-lg mb-6" />

                {/* Content skeleton */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
