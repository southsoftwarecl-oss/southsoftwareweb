/** Imagen OG por caso (next/og): nombre, rubro y captura real del sitio. */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CASES } from '@/content/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Caso de South Software';

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CASES.find((x) => x.slug === slug) ?? CASES[0];
  const img = await readFile(join(process.cwd(), 'public', c.image));
  const src = `data:image/jpeg;base64,${img.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0A0A0B', color: '#EEF2F6', padding: 56, gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 430 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: '#A4ADB8' }}>SOUTH SOFTWARE · CASO</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>{c.name}</div>
            <div style={{ fontSize: 26, color: '#A4ADB8', marginTop: 18 }}>{c.meta}</div>
          </div>
          <div style={{ fontSize: 22, color: '#8FB4E3' }}>Software &amp; Marketing</div>
        </div>
        <div style={{ display: 'flex', flex: 1, borderRadius: 18, overflow: 'hidden', border: '1px solid #2A2D33' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={610} height={518} style={{ objectFit: 'cover', objectPosition: 'top left' }} />
        </div>
      </div>
    ),
    size,
  );
}
