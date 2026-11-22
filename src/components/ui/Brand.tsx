export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="text-center leading-tight">
      <div className={`font-black tracking-tight ${small ? "text-xl" : "text-4xl sm:text-5xl"}`}>
        AI <span className="text-brand-200">Quiz</span>
      </div>
      <div className={`font-semibold text-brand-200 ${small ? "text-xs" : "text-sm sm:text-base"}`}>Workshop DT DS León</div>
    </div>
  );
}
