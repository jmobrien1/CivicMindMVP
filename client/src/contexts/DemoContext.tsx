import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type DemoRole = "resident" | "staff";

interface DemoContextType {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  isDemoMode: boolean;
  residentSessionId: string | null;
  setResidentSessionId: (sessionId: string | null) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("resident");
  const [residentSessionId, setResidentSessionId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetch("/api/demo/status")
      .then((res) => res.json())
      .then((data) => setIsDemoMode(data.enabled))
      .catch(() => setIsDemoMode(false));
  }, []);

  const setRole = (newRole: DemoRole) => {
    setRoleState(newRole);
    localStorage.setItem("demo_role", newRole);
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("demo_role") as DemoRole;
    if (savedRole === "resident" || savedRole === "staff") {
      setRoleState(savedRole);
    }
  }, []);

  return (
    <DemoContext.Provider value={{ role, setRole, isDemoMode, residentSessionId, setResidentSessionId }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}
