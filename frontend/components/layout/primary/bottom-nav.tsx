import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MessageCircle, Calendar, Home, Plus } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    showLabel: true,
    isFloating: false,
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: Calendar,
    showLabel: true,
    isFloating: false,
  },
  {
    href: "/book-appointment?step=service",
    label: "",
    icon: Plus,
    showLabel: false,
    isFloating: true,
  },
  {
    href: "/support",
    label: "Chat",
    icon: MessageCircle,
    showLabel: true,
    isFloating: false,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    showLabel: true,
    isFloating: false,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Helper to check if a path is active
  const isActive = (href: string) => {
    const baseHref = href.split("?")[0];
    return pathname === baseHref;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden rounded-t-2xl shadow-md">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          if (item.isFloating) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-10 h-10 rounded-full flex items-center justify-center -mt-6 shadow-md ${
                  pathname.startsWith("/book-appointment")
                    ? "bg-green-700"
                    : "bg-green-600"
                }`}
              >
                <Icon className="w-4 h-4 text-white" />
              </Link>
            );  
          }
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active ? "text-green-700" : "text-gray-400"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  active ? "text-green-700" : "text-gray-400"
                }`}
              />
              {item.showLabel && (
                <span
                  className={`text-[10px] ${
                    active ? "text-green-700" : "text-gray-400"
                  }${item.label === "Home" ? "" : ""}`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
