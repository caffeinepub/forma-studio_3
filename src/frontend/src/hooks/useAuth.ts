import { useState } from "react";

export type UserRole = "admin" | "client";

export interface CurrentUser {
  username: string;
  role: UserRole;
  clientId?: string;
}

export interface ClientCredential {
  password: string;
  clientId: string;
}

function getStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("forma_current_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCredentials(): Record<string, ClientCredential> {
  try {
    const raw = localStorage.getItem("forma_client_credentials");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    getStoredUser,
  );

  function login(
    username: string,
    password: string,
  ): { success: boolean; error?: string } {
    // Admin login
    if (username === "admin" && password === "admin123") {
      const user: CurrentUser = { username: "admin", role: "admin" };
      localStorage.setItem("forma_current_user", JSON.stringify(user));
      setCurrentUser(user);
      return { success: true };
    }

    // Client login
    const creds = getCredentials();
    const cred = creds[username];
    if (cred && cred.password === password) {
      const user: CurrentUser = {
        username,
        role: "client",
        clientId: cred.clientId,
      };
      localStorage.setItem("forma_current_user", JSON.stringify(user));
      setCurrentUser(user);
      return { success: true };
    }

    return { success: false, error: "Invalid username or password" };
  }

  function logout() {
    localStorage.removeItem("forma_current_user");
    setCurrentUser(null);
  }

  function saveClientCredentials(
    username: string,
    password: string,
    clientId: string,
  ) {
    const creds = getCredentials();
    creds[username] = { password, clientId };
    localStorage.setItem("forma_client_credentials", JSON.stringify(creds));
  }

  function getClientCredentialsByClientId(
    clientId: string,
  ): { username: string } | null {
    const creds = getCredentials();
    const entry = Object.entries(creds).find(
      ([, v]) => v.clientId === clientId,
    );
    return entry ? { username: entry[0] } : null;
  }

  return {
    currentUser,
    login,
    logout,
    saveClientCredentials,
    getClientCredentialsByClientId,
  };
}
