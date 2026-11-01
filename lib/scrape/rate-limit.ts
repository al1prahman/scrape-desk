// Politeness: jangan nembak domain yang sama terlalu cepat. Map in-memory
// per proses worker, cukup karena satu worker instance handle satu job
// pada satu waktu.

// Delay dibaca lazy dari process.env, bukan dari lib/env, supaya modul ini
// aman di-import di unit test tanpa env lengkap.
function delayMs(): number {
  const parsed = Number(process.env.DOMAIN_DELAY_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000;
}

const lastHit = new Map<string, number>();

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Tunggu kalau domain yang sama baru saja dihit kurang dari delay.
export async function respectDomainDelay(url: string): Promise<void> {
  const delay = delayMs();
  if (delay <= 0) return;

  const domain = domainOf(url);
  const now = Date.now();
  const last = lastHit.get(domain) ?? 0;
  const remaining = last + delay - now;

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  lastHit.set(domain, Date.now());
}
