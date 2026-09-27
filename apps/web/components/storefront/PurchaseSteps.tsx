import Link from 'next/link';
import styles from './PurchaseSteps.module.scss';

export type PurchaseStepId = 'choose' | 'pay' | 'done';

/** Embudo real de Pumpkin: elegir en /boletos → pagar → listos (QR). */
const STEPS: readonly { id: PurchaseStepId; label: string; href: string }[] = [
  { id: 'choose', label: 'Elegir', href: '/boletos' },
  { id: 'pay', label: 'Pagar', href: '/checkout' },
  { id: 'done', label: 'Listos', href: '#' },
];

/**
 * Indicador de progreso. Los pasos ya completados son enlaces
 * (permiten volver sin perder contexto); el actual y los pendientes, no.
 */
export function PurchaseSteps({
  current,
  chooseHref = '/boletos',
}: {
  current: PurchaseStepId;
  /** Permite volver a boletos conservando la reserva en curso. */
  chooseHref?: string;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav className={styles.steps} aria-label="Progreso de compra">
      <ol>
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const href = step.id === 'choose' ? chooseHref : step.href;
          const content = (
            <>
              <span className={styles.index} aria-hidden="true">
                {done ? '✓' : i + 1}
              </span>
              <span className={styles.label}>{step.label}</span>
            </>
          );
          return (
            <li
              key={step.id}
              className={done ? styles.done : active ? styles.active : styles.todo}
            >
              {done && step.id !== 'done' ? (
                <Link href={href}>{content}</Link>
              ) : (
                <span aria-current={active ? 'step' : undefined}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
