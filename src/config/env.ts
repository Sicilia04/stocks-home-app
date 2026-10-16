// src/config/env.ts
// Loads the API URL from the .env files managed by Expo CLI.
// Each per-environment .env defines EXPO_PUBLIC_API_URL, which is inlined
// by Metro at compile time (not at runtime).
import { z } from 'zod';

const url = z
  .string({ error: () => 'EXPO_PUBLIC_API_URL manquant (voir .env, .env.development, .env.production)' })
  .min(1, 'EXPO_PUBLIC_API_URL est vide')
  .refine(v => /^https?:\/\/\S+/.test(v), 'URL invalide : doit commencer par http(s)://')
  .parse(process.env.EXPO_PUBLIC_API_URL);

export const API_BASE = url;
export const API_BASE_URL = url.replace(/\/api\/?$/, '');
