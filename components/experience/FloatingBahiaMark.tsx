import { BahiaOrnament } from './BahiaOrnament';

export function FloatingBahiaMark() {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-30 flex items-center gap-1.5 rounded-full border border-red-500/35 bg-black/45 px-2.5 py-2 text-[0.56rem] uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_28px_rgba(225,18,27,0.24)] backdrop-blur sm:right-4 sm:gap-2 sm:px-3 sm:text-[0.65rem] sm:tracking-[0.28em]">
      <BahiaOrnament compact />
      <span>Bahia</span>
    </div>
  );
}
