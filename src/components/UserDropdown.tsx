"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, ChevronDown, User, Settings } from "lucide-react";

interface UserDropdownProps {
  userName?: string | null;
  userImage?: string | null;
}

export function UserDropdown({ userName, userImage }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleResetData = async () => {
    if (confirmText !== "DELETE") return;

    setIsResetting(true);
    try {
      localStorage.clear();

      const response = await fetch("/api/user/reset", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset data");
      }

      signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Reset failed:", error);
      alert("Failed to reset data. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-9 px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {userImage ? (
            <div className="relative h-6 w-6">
              <Image
                src={userImage}
                alt="User"
                fill
                className="rounded-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="hidden sm:inline-block text-sm truncate max-w-[100px]">
            {userName || "User"}
          </span>
          <ChevronDown className="h-3 w-3 hidden sm:block" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover shadow-lg z-50">
              <div className="p-1">
                <a
                  href="/settings"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowResetModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset All Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-lg border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-500 mb-2">
              ⚠️ Danger Zone: Reset All Data
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete all your data from this application, including:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
              <li>Cached activities and streams</li>
              <li>AI analysis history</li>
              <li>User profile settings</li>
              <li>Local storage data</li>
            </ul>
            <p className="text-sm font-medium mb-4">
              Type <code className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded">DELETE</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmText !== "DELETE" || isResetting}
                onClick={handleResetData}
              >
                {isResetting ? "Resetting..." : "Reset All Data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
