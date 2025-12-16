'use client';

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50 animate-pulse">
            {/* Header placeholder */}
            <div className="h-16 bg-white border-b border-gray-200" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Title skeleton */}
                <div className="mb-10">
                    <div className="h-12 w-3/4 bg-gray-200 rounded mb-4" />
                    <div className="h-6 w-1/2 bg-gray-100 rounded" />
                </div>

                {/* Image gallery skeleton */}
                <div className="mb-16 rounded-3xl overflow-hidden bg-gray-200 h-[500px]" />

                {/* Content grid skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="h-24 bg-gray-100 rounded-lg" />
                        <div className="h-48 bg-gray-100 rounded-lg" />
                        <div className="h-32 bg-gray-100 rounded-lg" />
                    </div>

                    {/* Right column - booking widget */}
                    <div className="h-96 bg-gray-100 rounded-3xl border border-gray-200" />
                </div>
            </div>
        </div>
    );
}
