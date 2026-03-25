import {
  createCharacterSchema,
  createMiscSchema,
  createSystemSchema,
  createWorldSchema,
  updateCharacterSchema,
  updateMiscSchema,
  updateSystemSchema,
  updateWorldSchema,
} from '@moge/types';
import { z } from 'zod';

export const createCharacterRequestSchema = createCharacterSchema.strict();
export const updateCharacterRequestSchema = updateCharacterSchema.omit({ id: true }).strict();

export const createSystemRequestSchema = createSystemSchema.strict();
export const updateSystemRequestSchema = updateSystemSchema.omit({ id: true }).strict();

export const createWorldRequestSchema = createWorldSchema.strict();
export const updateWorldRequestSchema = updateWorldSchema.omit({ id: true }).strict();

export const createMiscRequestSchema = createMiscSchema.strict();
export const updateMiscRequestSchema = updateMiscSchema.omit({ id: true }).strict();

export type CreateCharacterRequest = z.infer<typeof createCharacterRequestSchema>;
export type UpdateCharacterRequest = z.infer<typeof updateCharacterRequestSchema>;
export type CreateSystemRequest = z.infer<typeof createSystemRequestSchema>;
export type UpdateSystemRequest = z.infer<typeof updateSystemRequestSchema>;
export type CreateWorldRequest = z.infer<typeof createWorldRequestSchema>;
export type UpdateWorldRequest = z.infer<typeof updateWorldRequestSchema>;
export type CreateMiscRequest = z.infer<typeof createMiscRequestSchema>;
export type UpdateMiscRequest = z.infer<typeof updateMiscRequestSchema>;
