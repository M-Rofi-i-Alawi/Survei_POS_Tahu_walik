export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <img
          src="/logo.png"
          alt="Cemil.in"
          className="w-24 h-24 rounded-2xl object-contain mx-auto drop-shadow-lg animate-bounce"
        />
        <h2 className="text-xl font-bold text-foreground">Cemil.in</h2>
        <p className="text-sm text-muted-foreground">Memuat data...</p>
        <div className="flex gap-1 justify-center">
          <span className="w-2 h-2 bg-[#FBAA31] rounded-full animate-bounce [animation-delay:0ms]"></span>
          <span className="w-2 h-2 bg-[#FBAA31] rounded-full animate-bounce [animation-delay:150ms]"></span>
          <span className="w-2 h-2 bg-[#FBAA31] rounded-full animate-bounce [animation-delay:300ms]"></span>
        </div>
      </div>
    </div>
  );
}