'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Provider = 'meta' | 'tiktok';

interface ConnectionSummary {
  provider: Provider;
  status: 'connected' | 'needs-attention' | 'disconnected';
  scopes: string[];
  expiresAt?: string;
  renewableUntil?: string;
  accountId: string;
  accountLabel: string;
  accountUsername?: string;
  relatedPageId?: string;
  relatedInstagramId?: string;
  connectedAt: string;
  updatedAt: string;
  lastHealthCheckAt?: string;
  lastHealthError?: string;
  renewable: boolean;
}

interface ConnectionsResponse {
  connections?: ConnectionSummary[];
  error?: string;
}

const LABELS: Record<Provider, string> = {
  meta: 'Instagram / Meta',
  tiktok: 'TikTok',
};

function readableDate(value: string | undefined): string {
  if (!value) return 'Not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Not reported'
    : parsed.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function SocialConnectionsClient() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [pending, setPending] = useState<Provider>();
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/autopilot/oauth/connections', {
      cache: 'no-store',
    });
    const payload = (await response.json()) as ConnectionsResponse;
    if (!response.ok) throw new Error(payload.error || 'Connections could not be loaded.');
    setConnections(payload.connections ?? []);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const callbackMessage = url.searchParams.get('oauth_message');
    if (callbackMessage) {
      setMessage(callbackMessage);
      url.searchParams.delete('oauth_provider');
      url.searchParams.delete('oauth_status');
      url.searchParams.delete('oauth_message');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    void load().catch((error) =>
      setMessage(error instanceof Error ? error.message : 'Connections could not be loaded.'),
    );
  }, [load]);

  const byProvider = useMemo(
    () => new Map(connections.map((connection) => [connection.provider, connection])),
    [connections],
  );

  function connect(provider: Provider) {
    window.location.href = `/api/admin/autopilot/oauth/${provider}/start?returnTo=${encodeURIComponent('/admin/settings')}`;
  }

  async function disconnect(provider: Provider) {
    if (!window.confirm(`Disconnect ${LABELS[provider]} from Club Bahia Promotion Autopilot?`)) {
      return;
    }
    setPending(provider);
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/oauth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Disconnect failed.');
      await load();
      setMessage(`${LABELS[provider]} was disconnected from the Growth OS.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Disconnect failed.');
    } finally {
      setPending(undefined);
    }
  }

  async function refreshTikTok() {
    setPending('tiktok');
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/oauth/tiktok/refresh', {
        method: 'POST',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'TikTok renewal failed.');
      await load();
      setMessage('TikTok authorization was renewed successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'TikTok renewal failed.');
    } finally {
      setPending(undefined);
    }
  }

  return (
    <section className="rounded-[1.6rem] border border-cyan-200/15 bg-[linear-gradient(145deg,rgba(8,22,25,.94),rgba(17,13,18,.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-100/65">
        Secure account authorization
      </p>
      <h2 className="mt-2 font-serif text-3xl text-white">Connect without copying tokens</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/56">
        Authorization happens on Meta or TikTok. Provider material returns to the server, is encrypted in the private Growth OS store, and is never displayed in this page.
      </p>

      {message ? (
        <p role="status" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/80">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {(['meta', 'tiktok'] as Provider[]).map((provider) => {
          const connection = byProvider.get(provider);
          const connected = connection?.status === 'connected' || connection?.status === 'needs-attention';
          return (
            <article key={provider} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-white/38">{LABELS[provider]}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {connection?.accountLabel || 'Not connected'}
                  </h3>
                  {connection?.accountUsername ? (
                    <p className="mt-1 text-sm text-white/48">@{connection.accountUsername}</p>
                  ) : null}
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${
                  connected
                    ? connection?.status === 'needs-attention'
                      ? 'border-red-200/20 bg-red-200/[.07] text-red-100'
                      : 'border-emerald-200/20 bg-emerald-200/[.07] text-emerald-100'
                    : 'border-white/12 bg-white/[.04] text-white/42'
                }`}>
                  {connection?.status || 'not connected'}
                </span>
              </div>

              {connection ? (
                <div className="mt-4 grid gap-2 text-xs text-white/52">
                  <p>Connected: {readableDate(connection.connectedAt)}</p>
                  <p>Access renewal: {connection.renewable ? 'Available' : 'Reconnect when required'}</p>
                  <p>Current access expires: {readableDate(connection.expiresAt)}</p>
                  {connection.lastHealthError ? (
                    <p className="text-red-100/75">Needs attention: {connection.lastHealthError}</p>
                  ) : null}
                  <p className="break-words">Approved scopes: {connection.scopes.length ? connection.scopes.join(', ') : 'Not reported'}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/48">
                  Connect the authorized Club Bahia account through the provider consent screen.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => connect(provider)}
                  disabled={pending === provider}
                  className="min-h-11 rounded-full bg-cyan-100 px-5 text-sm font-bold text-black disabled:opacity-40"
                >
                  {connected ? `Reconnect ${LABELS[provider]}` : `Connect ${LABELS[provider]}`}
                </button>
                {provider === 'tiktok' && connection?.renewable ? (
                  <button
                    type="button"
                    onClick={() => void refreshTikTok()}
                    disabled={pending === 'tiktok'}
                    className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/65 disabled:opacity-40"
                  >
                    Renew TikTok access
                  </button>
                ) : null}
                {connected ? (
                  <button
                    type="button"
                    onClick={() => void disconnect(provider)}
                    disabled={pending === provider}
                    className="min-h-11 rounded-full border border-red-200/15 px-4 text-sm font-semibold text-red-100/70 disabled:opacity-40"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
