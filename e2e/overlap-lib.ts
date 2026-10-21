/** Detector de solapes de texto y desborde horizontal (se ejecuta en el navegador). */
export type Hit = { kind: 'overlap' | 'overflow'; a: string; b?: string; area?: number; right?: number };
export function detectOverlaps(): Hit[] {
  const W = document.documentElement.clientWidth;
  const hits: Hit[] = [];
  const desc = (el: Element) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${id}${cls} "${(el.textContent || '').trim().slice(0, 40)}"`;
  };
  const visible = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.15) return false;
      if (e.getAttribute('aria-hidden') === 'true' && e !== document.body) return false;
    }
    return true;
  };
  const fixedRoot = (el: Element) => { for (let e: Element | null = el; e; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return e; } return null; };
  // clip por ancestros con overflow != visible (carruseles/tablas con scroll)
  const clipRect = (el: Element) => {
    let r = { l: -1e9, r: 1e9, t: -1e9, b: 1e9 };
    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const b = e.getBoundingClientRect(); r = { l: Math.max(r.l, b.left), r: Math.min(r.r, b.right), t: Math.max(r.t, b.top), b: Math.min(r.b, b.bottom) }; }
    }
    return r;
  };
  type Item = { el: Element; rects: DOMRect[]; fixed: Element | null };
  const items: Item[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map<Element, Item>();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent || !n.textContent.trim()) continue;
    const el = n.parentElement!; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue;
    if (!visible(el) || el.closest('svg, .sr-only, [aria-hidden="true"]') || (el.closest('details:not([open])') && !el.closest('summary'))) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const c = clipRect(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
      .map((r) => new DOMRect(Math.max(r.left, c.l), Math.max(r.top, c.t), Math.min(r.right, c.r) - Math.max(r.left, c.l), Math.min(r.bottom, c.b) - Math.max(r.top, c.t)))
      .filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) continue;
    // desborde horizontal de texto (fuera del viewport)
    for (const r of rects) if (r.right > W + 1 || r.left < -1) { hits.push({ kind: 'overflow', a: desc(el), right: Math.round(r.right) }); break; }
    const it = seen.get(el); if (it) it.rects.push(...rects); else { const ni = { el, rects, fixed: fixedRoot(el) }; seen.set(el, ni); items.push(ni); }
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = items[i], B = items[j];
    if (!!A.fixed !== !!B.fixed) continue; // flotantes vs. contenido que pasa por debajo: esperado (flotante vs. flotante sí cuenta)
    for (const ra of A.rects) for (const rb of B.rects) {
      // margen de 2px para descendentes/ascendentes de líneas contiguas
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) - 1;
      // los titulares usan line-height < 1: se tolera ~40 % de la altura menor (cajas de glifo, no tinta)
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) - Math.max(3, 0.4 * Math.min(ra.height, rb.height));
      if (w > 2 && h > 2 && w * h > 20) { hits.push({ kind: 'overlap', a: desc(A.el), b: desc(B.el), area: Math.round(w * h) }); break; }
    }
  }
  if (document.documentElement.scrollWidth > W + 1) hits.push({ kind: 'overflow', a: 'document', right: document.documentElement.scrollWidth });
  return hits;
}
