import React, { useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ShieldCheck, Lock, Eye, Database, Clock } from 'lucide-react';
import styles from './SupportPages.module.css';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'collection', label: '1. Information We Collect' },
    { id: 'usage', label: '2. How We Use Data' },
    { id: 'reading-sync', label: '3. Reading Progress & Library' },
    { id: 'security', label: '4. Data Security & Storage' },
    { id: 'cookies', label: '5. Cookies & Local Storage' },
    { id: 'third-party', label: '6. Third-Party Infrastructure' },
    { id: 'rights', label: '7. Your Privacy Rights' },
    { id: 'contact', label: '8. Privacy Officer Contact' }
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Privacy Policy' }]} />

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <ShieldCheck size={12} /> Privacy & Compliance
            </span>
            <span className={styles.metaText}>
              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
              Last Updated: September 2026
            </span>
          </div>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>
            Your privacy and digital security matter to us. Learn how KuroYomi collects, safeguards, and respects your personal reading data.
          </p>
        </header>

        <div className={styles.contentLayout}>
          {/* Quick Jump Sidebar */}
          <aside className={styles.tocSidebar}>
            <div className={styles.tocTitle}>Table of Contents</div>
            <nav className={styles.tocList}>
              {tocItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={styles.tocItem}>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Privacy Content */}
          <main className={styles.docCard}>
            <section id="collection" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>1</span>
                Information We Collect
              </h2>
              <p className={styles.paragraph}>
                We collect personal information necessary to deliver high-performance digital reading experiences, manage authentication, and handle virtual purchases:
              </p>
              <ul className={styles.list}>
                <li><strong>Account Data:</strong> Email address, display name, username, and encrypted credentials.</li>
                <li><strong>Verification Records:</strong> Time-stamped One-Time Password (OTP) validation logs for account safety.</li>
                <li><strong>Wallet & Transactions:</strong> Virtual coin balances, sandbox payment histories, order IDs, and unlocked volume identifiers.</li>
                <li><strong>Technical Telemetry:</strong> Browser specifications, viewport dimensions for canvas layout calculations, network round-trip latency, and IP addresses.</li>
              </ul>
            </section>

            <section id="usage" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>2</span>
                How We Use Your Data
              </h2>
              <p className={styles.paragraph}>
                We do not sell, rent, or trade your personal reading profiles to external data brokers. We utilize collected information strictly to:
              </p>
              <ul className={styles.list}>
                <li>Authenticate your identity and prevent credential stuffing or unauthorized account access.</li>
                <li>Render chapter images smoothly across continuous vertical webtoon and horizontal manga reading modes.</li>
                <li>Deliver notifications regarding new chapters, series updates, or password resets requested by you.</li>
                <li>Analyze aggregated platform performance to improve reader frame rates and CDN caching.</li>
              </ul>
            </section>

            <section id="reading-sync" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>3</span>
                Reading Progress & Cloud Library Sync
              </h2>
              <p className={styles.paragraph}>
                When you read a series on KuroYomi, our client synchronizes your current scroll percentage, active volume, and completed chapters with your account. This enables seamless cross-device resumption, allowing you to switch between desktop and mobile reading without losing your place.
              </p>
            </section>

            <section id="security" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>4</span>
                Data Security, Passwords & Encryption
              </h2>
              <p className={styles.paragraph}>
                Security is foundational to KuroYomi's architecture:
              </p>
              <ul className={styles.list}>
                <li><strong>Password Hashing:</strong> Passwords are never stored in plaintext and are salted and hashed utilizing Argon2 / bcrypt cryptographic algorithms.</li>
                <li><strong>Secure Transport:</strong> All data in transit between your browser and KuroYomi servers is encrypted via TLS 1.3 / HTTPS.</li>
                <li><strong>Tokenized Sessions:</strong> Authentication relies on JSON Web Tokens (JWT) with automatic refresh token rotation.</li>
              </ul>
              <div className={`${styles.calloutBox} ${styles.calloutInfo}`}>
                <strong>Data Privacy Guarantee:</strong> We do not track your browsing activity across third-party websites or inject invasive behavioral tracking pixels.
              </div>
            </section>

            <section id="cookies" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>5</span>
                Cookies & Local Browser Storage
              </h2>
              <p className={styles.paragraph}>
                We use browser <code>localStorage</code> and secure session cookies for vital functional purposes:
              </p>
              <ul className={styles.list}>
                <li><strong>Theme Preferences:</strong> Remembering your Dark / Light reading mode selection.</li>
                <li><strong>Reader Preferences:</strong> Remembering your reading layout (Vertical scroll vs Single Page vs Double Page).</li>
                <li><strong>Session State:</strong> Maintaining your logged-in reader session across tabs.</li>
              </ul>
            </section>

            <section id="third-party" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>6</span>
                Third-Party Infrastructure
              </h2>
              <p className={styles.paragraph}>
                To provide fast, resilient media delivery, KuroYomi partners with trusted enterprise cloud infrastructure providers:
              </p>
              <ul className={styles.list}>
                <li><strong>Amazon Web Services (AWS S3 & CloudFront):</strong> Encrypted asset hosting for high-resolution manga pages and chapter volumes.</li>
                <li><strong>Resend / SMTP Infrastructure:</strong> Transactional dispatch of 6-digit verification codes.</li>
                <li><strong>Sandbox Payment Gateways:</strong> Simulated billing engines with PCI-compliant payment gateways.</li>
              </ul>
            </section>

            <section id="rights" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>7</span>
                Your Privacy Rights (GDPR & CCPA)
              </h2>
              <p className={styles.paragraph}>
                Depending on your jurisdiction, you retain the right to:
              </p>
              <ul className={styles.list}>
                <li>Request an export copy of all account data and reading histories associated with your email.</li>
                <li>Request the complete deletion of your account and related telemetry.</li>
                <li>Opt out of non-essential transactional email communications.</li>
              </ul>
            </section>

            <section id="contact" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>8</span>
                Contact Our Data Protection Team
              </h2>
              <p className={styles.paragraph}>
                If you have questions regarding our privacy practices or wish to submit a data erasure request, contact our Data Protection Officer at <a href="mailto:privacy@kuroyomi.com" style={{ color: 'var(--color-brand-primary)' }}>privacy@kuroyomi.com</a> or message us via our <a href="/support" style={{ color: 'var(--color-brand-primary)' }}>Support Center</a>.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
