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
