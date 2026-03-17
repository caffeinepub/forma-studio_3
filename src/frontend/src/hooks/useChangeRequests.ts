import { useState } from "react";

export interface ChangeRequest {
  id: string;
  clientId: string;
  clientName: string;
  sessionId: string;
  sessionName: string;
  sessionDateTime: string;
  requestedDate: string;
  requestedTime: string;
  note: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
}

function loadRequests(): ChangeRequest[] {
  try {
    const raw = localStorage.getItem("forma_change_requests");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequests(requests: ChangeRequest[]) {
  localStorage.setItem("forma_change_requests", JSON.stringify(requests));
}

export function useChangeRequests() {
  const [requests, setRequests] = useState<ChangeRequest[]>(loadRequests);

  function addRequest(req: Omit<ChangeRequest, "id" | "createdAt" | "status">) {
    const newReq: ChangeRequest = {
      ...req,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const updated = [...requests, newReq];
    saveRequests(updated);
    setRequests(updated);
    return newReq;
  }

  function updateRequestStatus(id: string, status: "approved" | "declined") {
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    saveRequests(updated);
    setRequests(updated);
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return { requests, addRequest, updateRequestStatus, pendingCount };
}
