import React from "react";

interface PageSkeletonLoaderProps {
  tabName?: string;
}

export const PageSkeletonLoader: React.FC<PageSkeletonLoaderProps> = ({ tabName }) => {
  return (
    <div
      id="page-skeleton-loader"
      className="w-full max-w-7xl mx-auto space-y-6 animate-pulse p-2 sm:p-4 transition-all duration-300"
      aria-label="Loading page content"
      role="status"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-2">
          <div className="h-7 sm:h-8 w-40 sm:w-56 bg-slate-800/60 rounded-xl" />
          <div className="h-4 w-52 sm:w-72 bg-slate-800/40 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-800/50 rounded-xl" />
          <div className="h-9 w-28 bg-indigo-500/20 rounded-xl" />
        </div>
      </div>

      {/* Hero / Overview Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/70" />
            <div className="space-y-1.5">
              <div className="h-5 w-36 bg-slate-800/80 rounded-lg" />
              <div className="h-3.5 w-24 bg-slate-800/40 rounded-md" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-800/40 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-800/30 border border-white/5 space-y-2">
              <div className="h-3 w-16 bg-slate-800/50 rounded" />
              <div className="h-6 w-12 bg-slate-700/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid / Content Blocks Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-800/70 rounded-lg" />
              <div className="h-4 w-16 bg-slate-800/40 rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-full rounded-2xl bg-slate-800/30 border border-white/5 flex items-center px-4 justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800/60" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-36 bg-slate-800/60 rounded" />
                      <div className="h-3 w-20 bg-slate-800/40 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-800/40 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/5 space-y-4">
            <div className="h-5 w-28 bg-slate-800/70 rounded-lg" />
            <div className="h-32 w-full rounded-2xl bg-slate-800/30 border border-white/5" />
            <div className="h-4 w-full bg-slate-800/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
