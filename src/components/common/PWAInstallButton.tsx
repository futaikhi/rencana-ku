import React, { useState } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Download, Smartphone, Share, PlusSquare, X, Check } from "lucide-react";

interface PWAInstallButtonProps {
  variant?: "pill" | "banner" | "button" | "compact";
  className?: string;
  showAlways?: boolean; // When true, shows an informational action even if beforeinstallprompt hasn't fired yet
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "pill",
  className = "",
  showAlways = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already running installed standalone PWA, hide
  if (isInstalled && !installedSuccess) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstalledSuccess(true);
      }
    } else {
      // If beforeinstallprompt hasn't triggered or is iOS or desktop without prompt yet, show guided modal
      setShowGuideModal(true);
    }
  };

  // If not installable and not iOS and not showAlways, don't display
  if (!isInstallable && !isIOS && !showAlways) {
    return null;
  }

  return (
    <>
      {variant === "pill" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black bg-[#E0FF62] hover:bg-[#d5f54c] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${className}`}
          title="Install PlanCraft App (PWA)"
        >
          <Download size={13} className="stroke-[3] text-black" />
          <span>Install App</span>
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`p-2 text-black bg-white hover:bg-[#E0FF62] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${className}`}
          title="Install PlanCraft as Progressive Web App"
          aria-label="Install App"
        >
          <Download size={15} className="stroke-[2.5]" />
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#E0FF62] hover:bg-[#d5f54c] text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${className}`}
        >
          <Smartphone size={16} className="stroke-[2.5]" />
          <span>Install PlanCraft App</span>
        </button>
      )}

      {variant === "banner" && (
        <div
          className={`flex items-center justify-between p-3 bg-[#FAF8F5] border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${className}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E0FF62] border-2 border-black rounded-xl">
              <Smartphone size={20} className="stroke-[2.5] text-black" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-black">Install PlanCraft</p>
              <p className="text-[11px] text-black/70 font-medium">
                Install as a native app on your home screen for quick offline access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-black text-white hover:bg-black/85 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Install
          </button>
        </div>
      )}

      {/* Guided Instructions Modal (iOS Safari & Browser Guide) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border-3 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white border-2 border-black rounded-full hover:bg-[#FFE4E6] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              aria-label="Close modal"
            >
              <X size={16} className="stroke-[3]" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-[#E0FF62] border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Smartphone size={24} className="stroke-[2.5] text-black" />
              </div>
              <div>
                <h3 className="text-base font-black text-black uppercase tracking-tight">
                  Install PlanCraft (PWA)
                </h3>
                <p className="text-xs font-medium text-black/60">
                  Fast, standalone home screen experience
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-black">
                <p className="font-bold text-black/80">
                  Follow these simple steps in Safari on your iPhone or iPad:
                </p>
                <div className="p-3 bg-white border-2 border-black rounded-2xl space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#E0FF62] text-black border border-black rounded-full text-[10px] font-black shrink-0">
                      1
                    </span>
                    <div className="leading-snug">
                      Tap the <strong className="inline-flex items-center gap-1 font-black bg-zinc-100 px-1 py-0.5 rounded border border-black/20"><Share size={11} /> Share</strong> button in your Safari toolbar (bottom or top bar).
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#E0FF62] text-black border border-black rounded-full text-[10px] font-black shrink-0">
                      2
                    </span>
                    <div className="leading-snug">
                      Scroll down and select <strong className="inline-flex items-center gap-1 font-black bg-zinc-100 px-1 py-0.5 rounded border border-black/20"><PlusSquare size={11} /> Add to Home Screen</strong>.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#E0FF62] text-black border border-black rounded-full text-[10px] font-black shrink-0">
                      3
                    </span>
                    <div className="leading-snug">
                      Tap <strong>Add</strong> in the top-right corner. PlanCraft will appear on your home screen like a native app!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-black">
                <p className="font-bold text-black/80">
                  Install PlanCraft on your desktop or Android device:
                </p>
                <div className="p-3 bg-white border-2 border-black rounded-2xl space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#E0FF62] text-black border border-black rounded-full text-[10px] font-black shrink-0">
                      1
                    </span>
                    <div className="leading-snug">
                      In Chrome, Edge, or Brave, click the <strong>Install</strong> icon in the address bar (or menu &gt; <strong>Install PlanCraft</strong> / <strong>Add to Home Screen</strong>).
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#E0FF62] text-black border border-black rounded-full text-[10px] font-black shrink-0">
                      2
                    </span>
                    <div className="leading-snug">
                      Confirm installation to launch PlanCraft in its own distraction-free standalone window.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full py-2.5 bg-black text-white hover:bg-black/90 font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
