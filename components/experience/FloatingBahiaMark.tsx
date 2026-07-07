import { BahiaOrnament } from './BahiaOrnament';

export function FloatingBahiaMark() {
  return (
    <div className="fixed bottom-4 right-4 z-30 hidden items-center gap-2 rounded-full border border-red-500/35 bg-black/45 px-3 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-amber-100 shadow-[0_0_28px_rgba(225,18,27,0.24)] backdrop-blur md:flex">
      <BahiaOrnament compact />
      <span>Bahia</span>
    </div>
  );
}
