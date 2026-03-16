import { useEffect } from "react";
import type { Client, ReformerStatus, Session } from "../types";

const today = new Date().toISOString().split("T")[0];

const SEED_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Sofia Marchetti",
    email: "sofia.marchetti@email.com",
    phone: "+1 555 0101",
    sessionFrequency: "3x",
    paymentCycle: "Monthly",
    feeAmount: 320,
    assignedReformer: "R1",
    status: "Active",
    planStartDate: "2026-03-01",
  },
  {
    id: "c2",
    name: "Elena Vasquez",
    email: "elena.vasquez@email.com",
    phone: "+1 555 0202",
    sessionFrequency: "2x",
    paymentCycle: "Quarterly",
    feeAmount: 240,
    assignedReformer: "R2",
    status: "Active",
    planStartDate: "2026-02-15",
  },
  {
    id: "c3",
    name: "Claire Fontaine",
    email: "claire.fontaine@email.com",
    phone: "+1 555 0303",
    sessionFrequency: "1x",
    paymentCycle: "6-Month",
    feeAmount: 150,
    assignedReformer: "R3",
    status: "Active",
    planStartDate: "2025-10-01",
  },
  {
    id: "c4",
    name: "Naomi Ishikawa",
    email: "naomi.ishikawa@email.com",
    phone: "+1 555 0404",
    sessionFrequency: "2x",
    paymentCycle: "Monthly",
    feeAmount: 280,
    assignedReformer: "R1",
    status: "Active",
    planStartDate: "2026-03-10",
  },
  {
    id: "c5",
    name: "Isabelle Laurent",
    email: "isabelle.laurent@email.com",
    phone: "+1 555 0505",
    sessionFrequency: "1x",
    paymentCycle: "Monthly",
    feeAmount: 180,
    assignedReformer: "R2",
    status: "Inactive",
    planStartDate: "2026-01-01",
  },
];

const SEED_SESSIONS: Session[] = [
  {
    id: "s1",
    name: "Morning Flow",
    date: today,
    time: "07:30",
    duration: 60,
    trainer: "Mia Chen",
    sessionType: "Reformer Group",
    reformerAssignment: "R1",
    capacity: 6,
    enrolled: 4,
  },
  {
    id: "s2",
    name: "Private Reform",
    date: today,
    time: "10:00",
    duration: 45,
    trainer: "Luca Bianchi",
    sessionType: "Private",
    reformerAssignment: "R2",
    capacity: 1,
    enrolled: 1,
  },
  {
    id: "s3",
    name: "Evening Sculpt",
    date: today,
    time: "17:00",
    duration: 60,
    trainer: "Mia Chen",
    sessionType: "Reformer Group",
    reformerAssignment: "R1",
    capacity: 6,
    enrolled: 5,
  },
  {
    id: "s4",
    name: "Mat Restore",
    date: today,
    time: "19:00",
    duration: 45,
    trainer: "Luca Bianchi",
    sessionType: "Mat",
    reformerAssignment: "None",
    capacity: 8,
    enrolled: 3,
  },
  {
    id: "s5",
    name: "Core Intensive",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "09:00",
    duration: 90,
    trainer: "Mia Chen",
    sessionType: "Reformer Group",
    reformerAssignment: "R3",
    capacity: 4,
    enrolled: 2,
  },
];

const SEED_REFORMERS: ReformerStatus[] = [
  { id: "R1", status: "Occupied", currentClient: "Sofia Marchetti" },
  { id: "R2", status: "Available" },
  { id: "R3", status: "Maintenance" },
];

export function useSeedData() {
  useEffect(() => {
    if (!localStorage.getItem("forma_clients")) {
      localStorage.setItem("forma_clients", JSON.stringify(SEED_CLIENTS));
    }
    if (!localStorage.getItem("forma_sessions")) {
      localStorage.setItem("forma_sessions", JSON.stringify(SEED_SESSIONS));
    }
    if (!localStorage.getItem("forma_reformers")) {
      localStorage.setItem("forma_reformers", JSON.stringify(SEED_REFORMERS));
    }
  }, []);
}
