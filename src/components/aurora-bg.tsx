export function AuroraBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-neon-violet/30 blur-[120px] animate-float-slow" />
      <div className="absolute top-40 right-0 h-[380px] w-[380px] rounded-full bg-neon-cyan/25 blur-[120px] animate-float-slow [animation-delay:-3s]" />
      <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-neon-magenta/20 blur-[120px] animate-float-slow [animation-delay:-6s]" />
    </div>
  );
}
