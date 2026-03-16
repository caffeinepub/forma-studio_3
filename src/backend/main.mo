import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

actor {
  type Client = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    sessionFrequency : Nat;
    paymentCycle : Text;
    feeAmount : Nat;
    assignedReformer : Text;
    status : Text;
    planStartDate : Int;
  };

  module Client {
    public func compare(client1 : Client, client2 : Client) : Order.Order {
      Text.compare(client1.name, client2.name);
    };
  };

  type Session = {
    id : Text;
    name : Text;
    date : Int;
    time : Text;
    duration : Nat;
    trainer : Text;
    sessionType : Text;
    reformerAssignment : Text;
    capacity : Nat;
    enrolled : Nat;
  };

  let clients = Map.empty<Text, Client>();
  let sessions = Map.empty<Text, Session>();
  let reformers = Map.empty<Text, Text>();

  public shared ({ caller }) func createClient(
    id : Text,
    name : Text,
    email : Text,
    phone : Text,
    sessionFrequency : Nat,
    paymentCycle : Text,
    feeAmount : Nat,
    assignedReformer : Text,
    status : Text,
    planStartDate : Int,
  ) : async () {
    if (clients.containsKey(id)) { Runtime.trap("Client already exists!") };
    let client : Client = {
      id;
      name;
      email;
      phone;
      sessionFrequency;
      paymentCycle;
      feeAmount;
      assignedReformer;
      status;
      planStartDate;
    };
    clients.add(id, client);
  };

  public shared ({ caller }) func updateClient(
    id : Text,
    name : Text,
    email : Text,
    phone : Text,
    sessionFrequency : Nat,
    paymentCycle : Text,
    feeAmount : Nat,
    assignedReformer : Text,
    status : Text,
    planStartDate : Int,
  ) : async () {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client does not exist!") };
      case (?_) {
        let client : Client = {
          id;
          name;
          email;
          phone;
          sessionFrequency;
          paymentCycle;
          feeAmount;
          assignedReformer;
          status;
          planStartDate;
        };
        clients.add(id, client);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : Text) : async () {
    if (not clients.containsKey(id)) { Runtime.trap("Client does not exist!") };
    clients.remove(id);
  };

  public query ({ caller }) func getClient(id : Text) : async Client {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client does not exist!") };
      case (?client) { client };
    };
  };

  public query ({ caller }) func getAllClients() : async [Client] {
    clients.values().toArray().sort();
  };

  public shared ({ caller }) func createSession(
    id : Text,
    name : Text,
    date : Int,
    time : Text,
    duration : Nat,
    trainer : Text,
    sessionType : Text,
    reformerAssignment : Text,
    capacity : Nat,
    enrolled : Nat,
  ) : async () {
    if (sessions.containsKey(id)) { Runtime.trap("Session already exists!") };
    let session : Session = {
      id;
      name;
      date;
      time;
      duration;
      trainer;
      sessionType;
      reformerAssignment;
      capacity;
      enrolled;
    };
    sessions.add(id, session);
  };

  public shared ({ caller }) func updateSession(
    id : Text,
    name : Text,
    date : Int,
    time : Text,
    duration : Nat,
    trainer : Text,
    sessionType : Text,
    reformerAssignment : Text,
    capacity : Nat,
    enrolled : Nat,
  ) : async () {
    switch (sessions.get(id)) {
      case (null) { Runtime.trap("Session does not exist!") };
      case (?_) {
        let session : Session = {
          id;
          name;
          date;
          time;
          duration;
          trainer;
          sessionType;
          reformerAssignment;
          capacity;
          enrolled;
        };
        sessions.add(id, session);
      };
    };
  };

  public shared ({ caller }) func deleteSession(id : Text) : async () {
    if (not sessions.containsKey(id)) { Runtime.trap("Session does not exist!") };
    sessions.remove(id);
  };

  public query ({ caller }) func getSession(id : Text) : async Session {
    switch (sessions.get(id)) {
      case (null) { Runtime.trap("Session does not exist!") };
      case (?session) { session };
    };
  };

  public query ({ caller }) func getAllSessions() : async [Session] {
    sessions.values().toArray();
  };

  public shared ({ caller }) func updateReformerStatus(reformerId : Text, status : Text) : async () {
    reformers.add(reformerId, status);
  };

  public query ({ caller }) func getReformerStatus(reformerId : Text) : async Text {
    switch (reformers.get(reformerId)) {
      case (null) { Runtime.trap("Reformer does not exist!") };
      case (?status) { status };
    };
  };

  public query ({ caller }) func getAllReformers() : async [(Text, Text)] {
    reformers.toArray();
  };
};
