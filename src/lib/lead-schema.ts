/** Intención desde un CTA (Elegir pack / Arma tu pack / Reservar cupo). Los montos los recalcula el servidor desde site.ts/arma.ts. */
import { z } from 'zod';
z.config({ jitless: true });
export const leadSchema = z.object({
  channel: z.enum(['elegir_pack', 'arma_tu_pack', 'reservar_cupo']),
  pack: z.string().trim().max(80).optional(),
  items: z.array(z.string().max(40)).max(20).optional(),
  when: z.string().trim().max(80).optional(),
  path: z.string().max(200).optional(),
});
export type LeadBeacon = z.infer<typeof leadSchema>;
