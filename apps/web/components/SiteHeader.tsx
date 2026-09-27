'use client';

import Link from 'next/link';
import { PumpkinMark } from '@boletera/ui';
import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredUser, getToken } from '@/lib/auth';
import styles from './SiteHeader.module.scss';

type SiteHeaderProps = {
  theme?: 'light' | 'dark';
};

/** Navegación de evento único — sin buscador de cartelera. */
const navItems: { href: string; label: string }[] = [
  { href: '/#boletos', label: 'Boletos' },
  { href: '/#atracciones', label: 'Atracciones' },
  { href: '/boletos', label: 'Comprar' },
  { href: '/ayuda', label: 'Ayuda' },
];

export function SiteHeader(props: SiteHeaderProps) {
  return (
    <Suspense fallback={<SiteHeaderBar {...props} />}>
      <SiteHeaderBar {...props} />
    </Suspense>
  );
}

function SiteHeaderBar({ theme = 'light' }: SiteHeaderProps) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setLoggedIn(!!getToken());
    setName(user ? `${user.firstName}` : '');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const effectiveTheme = theme === 'dark' && !scrolled ? 'dark' : 'light';

  return (
    <header
      className={`${styles.header} ${effectiveTheme === 'dark' ? styles.dark : ''} ${
        scrolled ? styles.scrolled : ''
      } ${theme === 'dark' && !scrolled ? styles.overHero : ''}`}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Pumpkin Zone inicio">
          <span className={styles.logo}>
            <PumpkinMark size={30} aria-hidden="true" />
          </span>
          <span className={styles.brandText}>PUMPKIN ZONE</span>
        </Link>

        <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`}>
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href.startsWith('/') &&
                !item.href.includes('#') &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.navActive : styles.navLink}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link href="/boletos" className={styles.cta} onClick={() => setOpen(false)}>
            Comprar
          </Link>
          {loggedIn ? (
            <Link href="/cuenta" className={styles.userLink}>
              <span className={styles.avatar}>{(name || 'M').charAt(0).toUpperCase()}</span>
              <span className={styles.userText}>{name || 'Cuenta'}</span>
            </Link>
          ) : (
            <Link href="/login" className={styles.userLink}>
              Entrar
            </Link>
          )}
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
