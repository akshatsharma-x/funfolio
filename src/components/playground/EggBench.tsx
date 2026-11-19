"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/bus";
import { command } from "@/lib/commands";

type Row = { id: string; name: string; trigger: string; effect: string; achievement: string | null; minFx: string; speedrun: boolean };

/** Reads the save's found eggs straight from localStorage (the store stays out of this page's bundle). */
const readFound = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("funfolio-save") ?? "null")?.state?.stats?.eggsFound ?? [];
  } catch {
    return [];
  }
};

export function EggBench({ eggs }: { eggs: Row[] }) {
  const [found, setFound] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setFound(readFound());
    const t = window.setTimeout(sync, 0);
    const off = bus.on("egg:found", () => window.setTimeout(sync, 50));
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(t);
      off();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <table className="egg-bench__table">
      <caption className="sr-only">Every easter egg, how it&apos;s found and a button to trigger it</caption>
      <thead>
        <tr>
          <th scope="col">Egg</th>
          <th scope="col">Trigger</th>
          <th scope="col">Effect</th>
          <th scope="col">Achievement</th>
          <th scope="col">Min FX</th>
          <th scope="col">Speedrun</th>
          <th scope="col">Found</th>
          <th scope="col">Run</th>
        </tr>
      </thead>
      <tbody>
        {eggs.map((e) => (
          <tr key={e.id} data-egg-row={e.id}>
            <th scope="row">{e.name}</th>
            <td>{e.trigger}</td>
            <td>{e.effect}</td>
            <td>{e.achievement ?? "—"}</td>
            <td>{e.minFx}</td>
            <td>{e.speedrun ? "on" : "off"}</td>
            <td data-egg-found={found.includes(e.id) ? "yes" : "no"}>{found.includes(e.id) ? "✓" : "—"}</td>
            <td>
              <button type="button" className="arcade-btn" data-size="sm" data-egg-trigger={e.id} onClick={() => command({ type: "egg", id: e.id })}>
                Trigger
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
