import { BahiaCrest } from './BahiaCrest';

export function FloatingBahiaMark() {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(0.75rem+env(safe-area-inset-right))] z-30 flex min-h-11 items-center gap-1.5 rounded-full border border-amber-300/25 bg-[#090304]/68 px-2.5 py-1.5 text-[0.54rem] uppercase tracking-[0.14em] text-amber-100 shadow-[0_0_22px_rgba(225,18,27,0.28)] backdrop-blur-md sm:right-[calc(1rem+env(safe-area-inset-right))] sm:gap-2 sm:px-3 sm:text-[0.62rem] sm:tracking-[0.24em]">
      <BahiaCrest compact className="w-7 shrink-0 sm:w-8" />
      <span>Bahia</span>
    </div>
  );
}
