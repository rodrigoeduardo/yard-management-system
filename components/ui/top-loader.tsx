"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

/**
 * Global top progress bar.
 *
 * A single {@link TopLoader} is mounted once in the root layout and shows a
 * thin indeterminate bar whenever any tracked task (route navigation or a
 * pending form action) is in flight. Tasks report themselves into a shared
 * store through {@link useTopLoaderTask}; the bar is visible while at least one
 * task is active and hidden otherwise.
 */

let activeTasks = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isActive() {
  return activeTasks > 0;
}

function startTask() {
  activeTasks += 1;
  emit();
}

function endTask() {
  activeTasks = Math.max(0, activeTasks - 1);
  emit();
}

/**
 * Report a task's active state to the shared top-loader store. While `active`
 * is true the global bar stays visible; the cleanup (on `active` turning false
 * or the component unmounting mid-flight) releases it.
 */
export function useTopLoaderTask(active: boolean) {
  useEffect(() => {
    if (!active) return;
    startTask();
    return endTask;
  }, [active]);
}

/**
 * Invisible reporter placed inside a `<Link>`; forwards that link's navigation
 * pending state to the top loader via {@link useLinkStatus}.
 */
export function LinkLoaderReporter() {
  const { pending } = useLinkStatus();
  useTopLoaderTask(pending);
  return null;
}

/**
 * Invisible reporter placed inside a `<form>`; forwards the form action's
 * pending state to the top loader via {@link useFormStatus}.
 */
export function FormLoaderReporter() {
  const { pending } = useFormStatus();
  useTopLoaderTask(pending);
  return null;
}

export function TopLoader() {
  const active = useSyncExternalStore(subscribe, isActive, () => false);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Carregando"
      className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-accent"
    >
      <div className="animate-top-loader h-full w-2/5 rounded-pill bg-primary" />
    </div>
  );
}
