import { Rocket } from "lucide-react";

interface RocketMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function RocketMascot({ size = "md", className = "" }: RocketMascotProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-24 h-24",
    xl: "w-36 h-36",
  };

  const iconSizes = {
    sm: 24,
    md: 36,
    lg: 56,
    xl: 84,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Retro panel container */}
      <div
        className={`
          ${sizeClasses[size]} 
          btn-gold
          flex items-center justify-center
        `}
      >
        <Rocket 
          size={iconSizes[size]} 
          className="transform -rotate-45 text-retro-black"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
