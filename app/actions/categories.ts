"use server";

import { updateTag } from "next/cache";
import {
  insertCategory,
  removeCategory,
  updateCategory as writeCategory,
} from "@/lib/data/categories";
import { tags } from "@/lib/data/tags";
import { runMutation, type ActionResult } from "@/lib/server/action";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  idSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from "@/lib/validation";

export async function createCategory(input: CategoryCreateInput): Promise<ActionResult> {
  return runMutation(async () => {
    await insertCategory({ id: crypto.randomUUID(), ...categoryCreateSchema.parse(input) });
    updateTag(tags.categories);
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<ActionResult> {
  return runMutation(async () => {
    await writeCategory(idSchema.parse(id), categoryUpdateSchema.parse(input));
    updateTag(tags.categories);
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return runMutation(async () => {
    await removeCategory(idSchema.parse(id));
    updateTag(tags.categories);
  });
}
