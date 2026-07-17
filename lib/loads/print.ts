import { z } from "zod";

export function isValidLoadId(id: string): boolean {
  return z.uuid().safeParse(id).success;
}
