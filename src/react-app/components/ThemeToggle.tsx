import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/react-app/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  const currentOption = options.find((o) => o.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative group">
      <button className="btn-retro p-2 flex items-center gap-1">
        <CurrentIcon size={18} />
      </button>
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        <div className="panel-raised p-1 min-w-[120px]">
          <div className="panel-inset p-1">
            <div className="text-xs font-bold text-retro-dark px-2 py-1 border-b-2 border-retro-darker mb-1">
              Theme
            </div>
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 transition-colors ${
                    theme === option.value
                      ? "bg-retro-gold text-retro-black font-bold"
                      : "hover:bg-retro-light"
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
