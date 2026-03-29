export const LoadingState = ({ label = "Loading SyncUp..." }: { label?: string }) => (
  <div className="glass-panel page-enter relative flex min-h-[220px] items-center justify-center overflow-hidden p-8">
    <div className="shimmer absolute inset-0 opacity-20" />
    <div className="space-y-3 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-electric" />
      <p className="text-sm font-medium text-frost/80">{label}</p>
    </div>
  </div>
);
