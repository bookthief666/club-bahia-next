export default function LoadingAdmin() {
  return <div className="grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-64 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[.06]" />)}</div>;
}
