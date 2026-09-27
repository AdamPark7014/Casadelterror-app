import Link from 'next/link';
import { EVENT } from '@/lib/event-config';
import styles from './SiteFooter.module.scss';

/**
 * Footer de evento único: sin columnas de marketplace
 * (categorías / ciudades / reventa).
 */
export function SiteFooter(_props?: { cities?: readonly { name: string; count: number }[] }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <p className={styles.brand}>{EVENT.name.toUpperCase()}</p>
          <p className={styles.tagline}>
            {EVENT.scheduleLabel} · {EVENT.venue.name}, {EVENT.venue.city}
          </p>
          <p className={styles.tagline}>Boletos oficiales · Pago seguro · Acceso con código QR</p>
        </div>

        <div className={styles.col}>
          <h3>Compra</h3>
          <ul>
            <li>
              <Link href="/boletos">Comprar boletos</Link>
            </li>
            <li>
              <Link href="/ayuda">Ayuda</Link>
            </li>
            <li>
              <Link href="/cuenta">Mi cuenta</Link>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Legal</h3>
          <ul>
            <li>
              <Link href="/terminos">Términos</Link>
            </li>
            <li>
              <Link href="/privacidad">Privacidad</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
