"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/userStore";
import { UserProfile, StravaTokens } from "@/types";
import { User, Heart, Ruler, Weight, Calendar, Link2, Unlink, CheckCircle, AlertCircle } from "lucide-react";

export function UserSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setProfile, tokens, setTokens, isConnected, disconnect, initializeFromStorage } = useUserStore();

  const [formData, setFormData] = useState<UserProfile>({
    age: 30,
    weight: 70,
    height: 170,
    restingHeartRate: 60,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresAt = searchParams.get("expires_at");
    const athleteId = searchParams.get("athlete_id");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success && accessToken && refreshToken && expiresAt && athleteId) {
      const newTokens: StravaTokens = {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt),
        athleteId: parseInt(athleteId),
      };
      setTokens(newTokens);
      setMessage({ type: "success", text: "Berhasil terhubung ke Strava!" });
      router.replace("/settings");
    } else if (error) {
      setMessage({ type: "error", text: decodeURIComponent(error) });
      router.replace("/settings");
    }
  }, [searchParams, setTokens, router]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSaveProfile = () => {
    setProfile(formData);
    setMessage({ type: "success", text: "Profil berhasil disimpan!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleConnectStrava = () => {
    window.location.href = "/api/strava/auth";
  };

  const handleDisconnect = () => {
    disconnect();
    setMessage({ type: "success", text: "Terputus dari Strava" });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profil Fisiologis
          </CardTitle>
          <CardDescription>
            Data ini digunakan untuk menghitung zona detak jantung dan analisis AI yang lebih akurat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Usia (tahun)
              </Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                min={10}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                Berat Badan (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                min={20}
                max={200}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Tinggi Badan (cm)
              </Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                min={100}
                max={250}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rhr" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Resting Heart Rate (bpm)
              </Label>
              <Input
                id="rhr"
                type="number"
                value={formData.restingHeartRate}
                onChange={(e) => handleInputChange("restingHeartRate", e.target.value)}
                min={30}
                max={100}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
            Simpan Profil
          </Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Koneksi Strava
          </CardTitle>
          <CardDescription>
            Hubungkan akun Strava Anda untuk mengambil data aktivitas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected && tokens ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-medium">Terhubung ke Strava</p>
                  <p className="text-sm text-muted-foreground">
                    Athlete ID: {tokens.athleteId}
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleDisconnect} className="w-full sm:w-auto">
                <Unlink className="h-4 w-4 mr-2" />
                Putuskan Koneksi
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Klik tombol di bawah untuk menghubungkan akun Strava Anda. Anda akan diarahkan ke halaman login Strava.
              </p>
              <Button onClick={handleConnectStrava} className="gradient-primary text-white w-full sm:w-auto">
                <Link2 className="h-4 w-4 mr-2" />
                Hubungkan ke Strava
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
