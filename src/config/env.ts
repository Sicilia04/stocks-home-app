// src/config/env.ts
// Charge l'URL de l'API depuis les fichiers .env gérés par Expo CLI.
// Chaque .env par environnement définit EXPO_PUBLIC_API_URL qui est inlinée
// par Metro à la compilation (pas à l'exécution).
import { z } from 'zod';

const url = z
  .string({ error: () => 'EXPO_PUBLIC_API_URL manquant (voir .env, .env.development, .env.production)' })
  .min(1, 'EXPO_PUBLIC_API_URL est vide')
  .refine(v => /^https?:\/\/\S+/.test(v), 'URL invalide : doit commencer par http(s)://')
  .parse(process.env.EXPO_PUBLIC_API_URL);

export const API_BASE = url;
export const API_BASE_URL = url.replace(/\/api\/?$/, '');
