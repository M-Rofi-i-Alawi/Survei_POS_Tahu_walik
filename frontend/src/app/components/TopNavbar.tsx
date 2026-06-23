import { Menu, Bell, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useState, useRef, useEffect } from "react";

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { notifications, markNotificationRead, storeConfig } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const stokHabisNotifs = notifications.filter((n) => n.type === "stok_habis" && !n.read);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-muted rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-bold text-lg">{storeConfig.name}</h2>
          <p className="text-xs text-muted-foreground">Pos Tahu Walik</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Stok Habis Banner */}
        {stokHabisNotifs.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-600">
              {stokHabisNotifs[0].message}
            </span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 hover:bg-muted rounded-lg relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-50">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm">Notifikasi</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Tidak ada notifikasi
                  </p>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/30 transition-colors ${
                        !notif.read ? "bg-[#FBAA31]/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg ${
                          notif.type === "stok_habis"
                            ? "bg-red-50"
                            : "bg-[#FBAA31]/10"
                        }`}>
                          <AlertTriangle className={`w-3.5 h-3.5 ${
                            notif.type === "stok_habis"
                              ? "text-red-500"
                              : "text-[#FBAA31]"
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.timestamp).toLocaleString("id-ID")}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-[#FBAA31] ml-auto mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
