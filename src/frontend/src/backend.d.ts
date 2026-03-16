import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Session {
    id: string;
    duration: bigint;
    sessionType: string;
    enrolled: bigint;
    date: bigint;
    name: string;
    time: string;
    trainer: string;
    reformerAssignment: string;
    capacity: bigint;
}
export interface Client {
    id: string;
    paymentCycle: string;
    status: string;
    feeAmount: bigint;
    assignedReformer: string;
    name: string;
    planStartDate: bigint;
    email: string;
    phone: string;
    sessionFrequency: bigint;
}
export interface backendInterface {
    createClient(id: string, name: string, email: string, phone: string, sessionFrequency: bigint, paymentCycle: string, feeAmount: bigint, assignedReformer: string, status: string, planStartDate: bigint): Promise<void>;
    createSession(id: string, name: string, date: bigint, time: string, duration: bigint, trainer: string, sessionType: string, reformerAssignment: string, capacity: bigint, enrolled: bigint): Promise<void>;
    deleteClient(id: string): Promise<void>;
    deleteSession(id: string): Promise<void>;
    getAllClients(): Promise<Array<Client>>;
    getAllReformers(): Promise<Array<[string, string]>>;
    getAllSessions(): Promise<Array<Session>>;
    getClient(id: string): Promise<Client>;
    getReformerStatus(reformerId: string): Promise<string>;
    getSession(id: string): Promise<Session>;
    updateClient(id: string, name: string, email: string, phone: string, sessionFrequency: bigint, paymentCycle: string, feeAmount: bigint, assignedReformer: string, status: string, planStartDate: bigint): Promise<void>;
    updateReformerStatus(reformerId: string, status: string): Promise<void>;
    updateSession(id: string, name: string, date: bigint, time: string, duration: bigint, trainer: string, sessionType: string, reformerAssignment: string, capacity: bigint, enrolled: bigint): Promise<void>;
}
