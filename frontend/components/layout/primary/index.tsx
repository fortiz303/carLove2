import BottomNav from "./bottom-nav";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  if (status === "unauthenticated") {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-6xl mx-auto">
        {children}
        <BottomNav />
      </div>
    </div>
  );
};

export default PrimaryLayout;
