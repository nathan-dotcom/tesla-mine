"use client";

import { useState } from "react";
import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import CloudMiningDashboard from "./components/CloudMiningDashboard";
import ProfileCompletionGate, { isProfileComplete } from "./components/ProfileCompletionGate";

export default function Page() {
  const [screen, setScreen] = useState("home");
  const [user,   setUser]   = useState(null);

  // Called right after login/register succeeds
  function handleAuthenticated(u) {
    setUser(u);
    // If profile is already fully filled, go straight to dashboard
    if (isProfileComplete(u?.id)) {
      setScreen("dashboard");
    } else {
      setScreen("profile-gate");
    }
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "profile-gate") {
    return (
      <ProfileCompletionGate
        user={user}
        onComplete={() => setScreen("dashboard")}
      />
    );
  }

  if (screen === "dashboard") {
    return (
      <CloudMiningDashboard
        user={user}
        onLogout={() => { setUser(null); setScreen("home"); }}
      />
    );
  }

  return <HomePage onStart={() => setScreen("auth")} />;
}