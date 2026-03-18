export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  sessionFrequency: "1x" | "2x" | "3x";
  paymentCycle: "Monthly" | "Quarterly" | "6-Month";
  feeAmount: number;
  assignedReformer: "R1" | "R2" | "R3";
  status: "Active" | "Inactive";
  planStartDate: string;
  lastPaidDate?: string;
  nextDueDate?: string;
};

export type Session = {
  id: string;
  name: string;
  date: string;
  time: string;
  duration: number;
  trainer: string;
  sessionType: "Reformer Group" | "Private" | "Mat";
  reformerAssignment: "R1" | "R2" | "R3" | "None";
  capacity: number;
  enrolled: number;
};

export type ReformerStatus = {
  id: "R1" | "R2" | "R3";
  status: "Available" | "Occupied" | "Maintenance";
  currentClient?: string;
};

export type Trainer = {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  workingDays: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  availableSlots: "Morning" | "Evening" | "Both";
  status: "Available" | "On Leave" | "Unavailable";
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  clientId: string;
  date: string;
  status: "Present" | "Absent" | "Late";
};

export type Payment = {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  method: "Cash" | "UPI" | "Bank Transfer";
  notes: string;
};

export type ReminderSettings = {
  studioWhatsApp: string;
  studioName: string;
  triggerDays: number[];
  messageTemplate: string;
};

export type RenewalRecord = {
  id: string;
  clientId: string;
  oldCycle: "Monthly" | "Quarterly" | "6-Month";
  oldFrequency: "1x" | "2x" | "3x";
  oldFee: number;
  cycleEndDate: string;
  status: "Pending" | "Renewed" | "Upgraded" | "Deactivated";
};

export type OperatingDay =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

export type DaySlot = {
  day: OperatingDay;
  slot: string; // e.g. "7:30 AM - 8:30 AM"
  reformer: "R1" | "R2" | "R3";
};

export type ClientSchedule = {
  clientId: string;
  scheduledDays: DaySlot[];
  weeklyFrequency?: "1x" | "2x" | "3x";
};

export type DayAttendanceStatus = "Pending" | "Attended" | "Missed";

export type WeeklyAttendance = {
  clientId: string;
  weekKey: string; // ISO date string of the Monday of that week e.g. "2026-03-16"
  days: Record<OperatingDay, DayAttendanceStatus>;
};
