export const LoadingState = ({ label = "Loading SyncUp..." }: { label?: string }) => (
  <div className="glass-panel page-enter relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-[2rem] p-8">
    <div className="shimmer absolute inset-0 opacity-30" />
    <div className="relative space-y-4 text-center">
      <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-border/70 border-t-accent shadow-soft" />
      <div>
        <p className="panel-title text-xl font-semibold">SyncUp is preparing your workspace</p>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);
