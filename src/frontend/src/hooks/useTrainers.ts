import { useEffect, useState } from "react";
import type { Trainer } from "../types";

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_trainers") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_trainers", JSON.stringify(trainers));
  }, [trainers]);

  const addTrainer = (t: Trainer) => setTrainers((prev) => [...prev, t]);
  const updateTrainer = (t: Trainer) =>
    setTrainers((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  const deleteTrainer = (id: string) =>
    setTrainers((prev) => prev.filter((x) => x.id !== id));

  return { trainers, addTrainer, updateTrainer, deleteTrainer };
}
