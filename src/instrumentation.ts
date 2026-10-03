export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startEmailBackgroundMonitor } = await import('@/lib/emailMonitor');
      startEmailBackgroundMonitor();
    } catch (err: any) {
      console.error('[Instrumentation] Erro ao iniciar monitor de e-mail:', err?.message || err);
    }
  }
}
