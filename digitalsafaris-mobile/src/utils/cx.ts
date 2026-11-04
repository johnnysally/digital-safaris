export type StyleArg = any;

export function cx(...args: StyleArg[]): StyleArg[] {
  const out: StyleArg[] = [];
  for (const a of args) {
    if (!a) continue;
    if (Array.isArray(a)) {
      const inner = cx(...a);
      if (inner.length) out.push(inner);
    } else {
      out.push(a);
    }
  }
  return out;
}

export default cx;