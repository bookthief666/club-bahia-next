export function BahiaOrnament({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'bahia-ornament bahia-ornament--compact' : 'bahia-ornament'} aria-hidden="true">
      <div className="bahia-ornament__sun" />
      <div className="bahia-ornament__horizon" />
      <div className="bahia-ornament__arch" />
      <div className="bahia-ornament__palm bahia-ornament__palm--left" />
      <div className="bahia-ornament__palm bahia-ornament__palm--right" />
    </div>
  );
}
