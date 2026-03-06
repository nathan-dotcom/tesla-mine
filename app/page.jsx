"use client";

import { useState } from "react";
import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import CloudMiningDashboard from "./components/CloudMiningDashboard";

export default function Page() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthenticated={(u) => { setUser(u); setScreen("dashboard"); }}
        onBack={() => setScreen("home")}
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