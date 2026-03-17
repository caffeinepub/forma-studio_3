import { useEffect } from "react";
import type {
  AttendanceRecord,
  Client,
  Payment,
  ReformerStatus,
  RenewalRecord,
  Session,
  Trainer,
} from "../types";

const today = new Date().toISOString().split("T")[0];

const SEED_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Sofia Marchetti",
    email: "sofia.marchetti@email.com",
    phone: "+91 98765 10101",
    sessionFrequency: "3x",
    paymentCycle: "Monthly",
    feeAmount: 10500,
    assignedReformer: "R1",
    status: "Active",
    planStartDate: "2026-03-01",
    lastPaidDate: "2026-03-01",
  },
  {
    id: "c2",
    name: "Elena Vasquez",
    email: "elena.vasquez@email.com",
    phone: "+91 98765 10202",
    sessionFrequency: "2x",
    paymentCycle: "Quarterly",
    feeAmount: 21000,
    assignedReformer: "R2",
    status: "Active",
    planStartDate: "2026-02-15",
    lastPaidDate: "2026-02-15",
  },
  {
    id: "c3",
    name: "Claire Fontaine",
    email: "claire.fontaine@email.com",
    phone: "+91 98765 10303",
    sessionFrequency: "1x",
    paymentCycle: "6-Month",
    feeAmount: 20000,
    assignedReformer: "R3",
    status: "Active",
    planStartDate: "2025-10-01",
    lastPaidDate: "2025-10-01",
  },
  {
    id: "c4",
    name: "Naomi Ishikawa",
    email: "naomi.ishikawa@email.com",
    phone: "+91 98765 10404",
    sessionFrequency: "2x",
    paymentCycle: "Monthly",
    feeAmount: 7500,
    assignedReformer: "R1",
    status: "Active",
    planStartDate: "2026-03-10",
    lastPaidDate: "2026-03-10",
  },
  {
    id: "c5",
    name: "Isabelle Laurent",
    email: "isabelle.laurent@email.com",
    phone: "+91 98765 10505",
    sessionFrequency: "1x",
    paymentCycle: "Monthly",
    feeAmount: 4000,
    assignedReformer: "R2",
    status: "Inactive",
    planStartDate: "2026-02-15",
    lastPaidDate: "2026-02-15",
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
    capacity: 3,
    enrolled: 3,
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
    capacity: 3,
    enrolled: 2,
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
    capacity: 3,
    enrolled: 1,
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
    capacity: 3,
    enrolled: 2,
  },
];

const SEED_REFORMERS: ReformerStatus[] = [
  { id: "R1", status: "Occupied", currentClient: "Sofia Marchetti" },
  { id: "R2", status: "Available" },
  { id: "R3", status: "Maintenance" },
];

const SEED_TRAINERS: Trainer[] = [
  {
    id: "t1",
    name: "Mia Chen",
    phone: "+91 98765 10001",
    specialization: "Reformer, Core",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    availableSlots: "Both",
    status: "Available",
  },
  {
    id: "t2",
    name: "Luca Bianchi",
    phone: "+91 98765 10002",
    specialization: "Mat, Stretch",
    workingDays: ["Mon", "Wed", "Fri", "Sat"],
    availableSlots: "Morning",
    status: "Available",
  },
  {
    id: "t3",
    name: "Priya Sharma",
    phone: "+91 98765 10003",
    specialization: "Reformer, Prenatal",
    workingDays: ["Tue", "Thu", "Sat", "Sun"],
    availableSlots: "Evening",
    status: "On Leave",
  },
];

const SEED_ATTENDANCE: AttendanceRecord[] = [
  { id: "a1", sessionId: "s1", clientId: "c1", date: today, status: "Present" },
  { id: "a2", sessionId: "s1", clientId: "c2", date: today, status: "Present" },
  { id: "a3", sessionId: "s1", clientId: "c3", date: today, status: "Late" },
  { id: "a4", sessionId: "s2", clientId: "c4", date: today, status: "Present" },
  { id: "a5", sessionId: "s3", clientId: "c1", date: today, status: "Present" },
  { id: "a6", sessionId: "s3", clientId: "c5", date: today, status: "Absent" },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: "p1",
    clientId: "c1",
    amount: 10500,
    date: "2026-03-01",
    method: "UPI",
    notes: "March monthly",
  },
  {
    id: "p2",
    clientId: "c2",
    amount: 21000,
    date: "2026-02-15",
    method: "Bank Transfer",
    notes: "Q1 payment",
  },
  {
    id: "p3",
    clientId: "c3",
    amount: 20000,
    date: "2025-10-01",
    method: "Cash",
    notes: "6-month plan",
  },
  {
    id: "p4",
    clientId: "c4",
    amount: 7500,
    date: "2026-03-10",
    method: "UPI",
    notes: "",
  },
];

const SEED_RENEWALS: RenewalRecord[] = [
  {
    id: "r1",
    clientId: "c5",
    oldCycle: "Monthly",
    oldFrequency: "1x",
    oldFee: 4000,
    cycleEndDate: "2026-03-16",
    status: "Pending",
  },
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
    if (!localStorage.getItem("forma_trainers")) {
      localStorage.setItem("forma_trainers", JSON.stringify(SEED_TRAINERS));
    }
    if (!localStorage.getItem("forma_attendance")) {
      localStorage.setItem("forma_attendance", JSON.stringify(SEED_ATTENDANCE));
    }
    if (!localStorage.getItem("forma_payments")) {
      localStorage.setItem("forma_payments", JSON.stringify(SEED_PAYMENTS));
    }
    if (!localStorage.getItem("forma_renewals")) {
      localStorage.setItem("forma_renewals", JSON.stringify(SEED_RENEWALS));
    }
  }, []);
}
