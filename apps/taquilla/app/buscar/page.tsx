'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTaquillaToken } from '@/lib/auth';
import { PosShell } from '@/components/PosShell';
import {
  fetchReceipt,
  getTerminalId,
  printReceipt,
  scanTicket,
  voidOrder,
  willcallLookup,
} from '@/lib/pos';
import styles from './buscar.module.scss';

function money(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ScanResult = {
  ticketId?: string;
  status: string;
  eventId: string;
  eventTitle: string;
  seatInfo: string;
  valid: boolean;
  orderId?: string;
  publicId?: string;
  paymentMethod?: string;
  total?: number;
  tickets?: { code: string; status: string; seatInfo: string }[];
};

type WillcallRow = {
  orderId: string;
  publicId: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  eventTitle: string;
  pickedUpAt: string | null;
  tickets: { code: string; seatInfo: string; status: string }[];
};

function looksLikeTicketCode(q: string): boolean {
  const v = q.trim();
  return (
    v.startsWith('BLT-') ||
    v.startsWith('{') ||
    /^[A-Z0-9-]{8,}$/i.test(v)
  );
}

export default function BuscarPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [orders, setOrders] = useState<WillcallRow[]>([]);
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const buffer = useRef('');
  const lastKey = useRef(0);

  useEffect(() => {
    if (!getTaquillaToken()) router.replace('/login');
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('lookup-input')?.focus();
        return;
      }
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      const now = Date.now();
      if (now - lastKey.current > 80) buffer.current = '';
      lastKey.current = now;
      if (e.key === 'Enter') {
        if (buffer.current.length >= 4) {
          setQuery(buffer.current);
          void runLookup(buffer.current);
        }
        buffer.current = '';
        return;
      }
      if (e.key.length === 1) buffer.current += e.key;
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runLookup(raw: string) {
    const code = raw.trim();
    if (!code) return;
    setLoading(true);
    setError('');
    setResult(null);
    setOrders([]);

    try {
      // 1) Código de boleto / QR → escaneo
      if (looksLikeTicketCode(code)) {
        try {
          const data = await scanTicket(code);
          setResult(data as ScanResult);
          return;
        } catch {
          /* cae a búsqueda por orden/nombre */
        }
      }

      // 2) Nombre, email o folio ORD-…
      const rows = (await willcallLookup(code)) as WillcallRow[];
      if (!rows.length) {
        setError('No se encontró boleto ni orden con ese dato.');
        return;
      }
      if (rows.length === 1) {
        const row = rows[0]!;
        setResult({
          status: row.pickedUpAt ? 'ENTREGADO' : 'COMPLETADA',
          eventId: '',
          eventTitle: row.eventTitle,
          seatInfo: row.tickets.map((t) => t.seatInfo || t.code).join(', ') || '—',
          valid: !row.pickedUpAt,
          orderId: row.orderId,
          publicId: row.publicId,
          total: row.total,
          tickets: row.tickets.map((t) => ({
            code: t.code,
            status: t.status,
            seatInfo: t.seatInfo,
          })),
        });
        return;
      }
      setOrders(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No encontrado');
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await runLookup(query);
  }

  async function reprint() {
    if (!result?.orderId) {
      setToast('Sin orden asociada');
      return;
    }
    try {
      const rec = await fetchReceipt(result.orderId, getTerminalId() || 'terminal');
      const print = await printReceipt(rec, { reprint: true });
      setToast(print.ok ? 'Reimprimiendo…' : print.error ?? 'No se pudo reimprimir');
    } catch {
      setToast('No se pudo reimprimir');
    }
  }

  async function doVoid() {
    if (!result?.orderId) return;
    if (!managerPin.trim()) {
      setToast('Ingresa el PIN de gerente');
      return;
    }
    const amount =
      result.total != null ? money(result.total) : 'el total de la orden';
    const qty = result.tickets?.length ?? 1;
    if (
      !window.confirm(
        `¿Anular esta venta?\n\n${qty} boleto(s) · ${amount}\nOrden ${result.publicId ?? result.orderId}\n\nEsta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setVoiding(true);
    try {
      await voidOrder(result.orderId, 'Anulación desde taquilla', managerPin.trim());
      setToast('Venta anulada');
      setResult({ ...result, status: 'ANULADA', valid: false });
      setManagerPin('');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo anular');
    } finally {
      setVoiding(false);
    }
  }

  return (
    <PosShell title="Buscar boleto u orden" eyebrow="Consulta · F3" backHref="/">
      {toast && (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      )}

      <p style={{ marginBottom: '0.75rem', opacity: 0.85 }}>
        Escanea un QR, pega un código BLT-… o busca por nombre, correo o folio ORD-…
      </p>

      <form onSubmit={(e) => void submit(e)} className={styles.search}>
        <input
          id="lookup-input"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Código, nombre, correo o folio…"
        />
        <button type="submit" disabled={loading}>
          {loading ? '…' : 'Buscar'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {orders.length > 1 && (
        <ul className={styles.result} style={{ listStyle: 'none', padding: 0 }}>
          {orders.map((row) => (
            <li key={row.orderId} style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                className={styles.actions}
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => {
                  setOrders([]);
                  setResult({
                    status: row.pickedUpAt ? 'ENTREGADO' : 'COMPLETADA',
                    eventId: '',
                    eventTitle: row.eventTitle,
                    seatInfo: row.tickets.map((t) => t.seatInfo || t.code).join(', ') || '—',
                    valid: !row.pickedUpAt,
                    orderId: row.orderId,
                    publicId: row.publicId,
                    total: row.total,
                    tickets: row.tickets.map((t) => ({
                      code: t.code,
                      status: t.status,
                      seatInfo: t.seatInfo,
                    })),
                  });
                }}
              >
                <strong>{row.publicId}</strong> · {row.buyerName || row.buyerEmail}
                <br />
                <small>
                  {row.eventTitle} · {money(row.total)}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}

      {result && (
        <section className={styles.result}>
          <header>
            <strong>{result.eventTitle}</strong>
            <span className={result.valid ? styles.ok : styles.bad}>{result.status}</span>
          </header>
          <dl>
            <div>
              <dt>Acceso</dt>
              <dd>{result.seatInfo}</dd>
            </div>
            {result.publicId && (
              <div>
                <dt>Orden</dt>
                <dd>{result.publicId}</dd>
              </div>
            )}
            {result.total != null && (
              <div>
                <dt>Total</dt>
                <dd>{money(result.total)}</dd>
              </div>
            )}
          </dl>

          <label className={styles.pinField}>
            <small>PIN de gerente (solo para anular)</small>
            <input
              type="password"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="PIN"
              autoComplete="off"
            />
          </label>

          <div className={styles.actions}>
            {result.orderId && (
              <button type="button" onClick={() => void reprint()}>
                Reimprimir
              </button>
            )}
            {result.orderId &&
              (result.status === 'COMPLETED' || result.status === 'COMPLETADA') && (
                <button
                  type="button"
                  className={styles.danger}
                  disabled={voiding}
                  onClick={() => void doVoid()}
                >
                  {voiding ? 'Anulando…' : 'Anular venta'}
                </button>
              )}
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.75 }}>
            Para cambiar boletos: anula esta venta y cobra de nuevo en Cobrar.
          </p>
        </section>
      )}
    </PosShell>
  );
}
