
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggleFab() {
  const { state, toggleSidebar } = useSidebar();

  // Only show the FAB when sidebar is collapsed
  if (state === "expanded") {
    return null;
  }

  return (
    <Button
      onClick={toggleSidebar}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
      size="icon"
    >
      <Settings className="h-6 w-6" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  );
}
