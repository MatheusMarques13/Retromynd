interface GameboyMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function GameboyMascot({ size = "md", className = "", animate = true }: GameboyMascotProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-24 h-24",
    xl: "w-36 h-36",
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${animate ? "animate-float" : ""}
          relative
          transform-gpu
        `}
        style={{
          filter: "drop-shadow(4px 6px 8px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 15px rgba(230, 115, 170, 0.3))",
          transform: "perspective(500px) rotateY(-5deg) rotateX(5deg)",
        }}
      >
        <img
          src="/assets/IMG_0363.png"
          alt="Retromynd Gameboy"
          className="w-full h-full object-contain"
          style={{
            imageRendering: "auto",
          }}
        />
      </div>
    </div>
  );
}
