"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Trash2, CheckCircle } from "lucide-react";
import { clearAllData } from "@/utils/storage";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export function UserSettings() {
  const { data: session } = useSession();
  const { setProfile, userProfile, isConnected, disconnectStrava } = useUserStore();

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    restingHeartRate: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        age: userProfile.age.toString(),
        weight: userProfile.weight.toString(),
        height: userProfile.height.toString(),
        restingHeartRate: userProfile.restingHeartRate.toString(),
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    const newProfile = {
      age: parseInt(formData.age) || 25,
      weight: parseInt(formData.weight) || 70,
      height: parseInt(formData.height) || 170,
      restingHeartRate: parseInt(formData.restingHeartRate) || 60,
      preferredActivity: userProfile?.preferredActivity || "Ride",
    };

    try {
      if (session) {
        const res = await fetch("/api/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProfile),
        });
        if (!res.ok) throw new Error("Failed to save to cloud");
      }

      setProfile(newProfile);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    setIsClearing(true);
    clearAllData();
    disconnectStrava();
    setTimeout(() => {
      setIsClearing(false);
      setShowClearModal(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your physiological profile and account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cloud Account</CardTitle>
            <CardDescription>
               Cloud database sync status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                      <div className="relative h-8 w-8">
                        <Image
                          src={session.user.image}
                          alt="Avatar"
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                  )}
                  <div>
                      <p className="font-medium text-blue-500">Connected as {session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">Your profile is synced to the cloud.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                   <p className="text-sm text-yellow-500">You are not logged in. Profile is only saved in this browser.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strava Connection (Local)</CardTitle>
            <CardDescription>
              Activity data access permission for this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Access Token Active</span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectStrava} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Disconnect
                </Button>
              </div>
            ) : (
               <Button onClick={() => signIn("strava", { callbackUrl: "/settings" })} className="w-full bg-[#fc4c02] text-white hover:bg-[#e34402]">
                  Connect Strava Token
                </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physiological Profile</CardTitle>
            <CardDescription>
               This data is used by AI for heart rate zone analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rhr">Resting Heart Rate (bpm)</Label>
                <Input
                  id="rhr"
                  type="number"
                  value={formData.restingHeartRate}
                  onChange={(e) => setFormData({ ...formData, restingHeartRate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {success ? "Saved" : "Save Profile"}
                {!loading && !success && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900/30">
          <CardHeader>
            <CardTitle className="text-red-500">Local Reset</CardTitle>
            <CardDescription>
              Clear browser cache if the app is having issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowClearModal(true)} disabled={isClearing}>
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Clear Local Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
        title="Clear Local Cache"
        description="This will clear all local cache and login data. Your cloud data will remain safe. Are you sure?"
        confirmLabel="Clear Cache"
        isDestructive={true}
      />
    </>
  );
}
