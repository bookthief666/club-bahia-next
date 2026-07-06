const ratioMap = {
  '16:9': 'aspect-[16/9]',
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
  '9:16': 'aspect-[9/16]',
};

type PlaceholderAssetProps = {
  label: string;
  ratio?: keyof typeof ratioMap;
  className?: string;
};

export function PlaceholderAsset({ label, ratio = '16:9', className = '' }: PlaceholderAssetProps) {
  return (
    <div
      className={`${ratioMap[ratio]} relative grid min-h-20 place-items-center overflow-hidden border-2 border-dashed border-white/20 bg-[#100d10] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,18,27,.22),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(246,183,60,.15),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_48%,rgba(255,255,255,.03))]" />
      <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(0deg,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:7px_7px]" />
      <div className="relative px-4 text-center">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-warmIvory">{label}</p>
        <p className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-mutedSand">future asset slot</p>
      </div>
    </div>
  );
}
