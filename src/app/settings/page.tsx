import { Suspense } from "react";
import { UserSettings } from "@/components/UserSettings";
import { Loader2 } from "lucide-react";

function SettingsContent() {
  return <UserSettings />;
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your profile and connect your Strava account.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  );
}
