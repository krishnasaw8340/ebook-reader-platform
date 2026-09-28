import React, { useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { FileText, ShieldAlert, Award, Clock } from 'lucide-react';
import styles from './SupportPages.module.css';

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'accounts', label: '2. User Accounts & OTP' },
    { id: 'intellectual-property', label: '3. Intellectual Property & IP' },
    { id: 'coin-purchases', label: '4. Sandboxed Coins & Unlocks' },
    { id: 'acceptable-use', label: '5. Acceptable Use Policy' },
    { id: 'termination', label: '6. Suspension & Termination' },
    { id: 'disclaimers', label: '7. Warranty Disclaimers' },
    { id: 'contact', label: '8. Inquiries & Legal Notices' }
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Terms of Service' }]} />

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <FileText size={12} /> Legal Agreement
            </span>
            <span className={styles.metaText}>
              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
              Last Updated: September 2026
            </span>
          </div>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.subtitle}>
            Please review these terms carefully before exploring, purchasing coin packages, or reading manga and webtoons on KuroYomi.
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

          {/* Main Legal Content */}
          <main className={styles.docCard}>
            <section id="acceptance" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>1</span>
                Acceptance of Terms
              </h2>
              <p className={styles.paragraph}>
                Welcome to <strong>KuroYomi</strong> ("Platform", "we", "our", or "us"). By accessing or utilizing our website, reader applications, APIs, and associated reader features, you affirm that you are at least 13 years of age (or have acquired permission from a parent or legal guardian) and agree to abide by these Terms of Service.
              </p>
              <p className={styles.paragraph}>
                If you do not agree with any provision stated within these terms, you must discontinue your use of KuroYomi and refrain from accessing digital publications on our services immediately.
              </p>
            </section>

            <section id="accounts" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>2</span>
                User Accounts, Authentication & Security
              </h2>
              <p className={styles.paragraph}>
                To access personalized features such as bookmarking, reading history, offline-ready caching, and digital volume purchases, you must register an account. During registration, you agree to:
              </p>
              <ul className={styles.list}>
                <li>Provide accurate, verifiable, and current email information.</li>
                <li>Complete mandatory One-Time Password (OTP) 6-digit email verification before executing transactions.</li>
                <li>Maintain the strict confidentiality of your credentials, password, and session tokens.</li>
                <li>Immediately notify KuroYomi Support of any suspected unauthorized access or account compromise.</li>
              </ul>
              <div className={`${styles.calloutBox} ${styles.calloutInfo}`}>
                <strong>Security Notice:</strong> KuroYomi employs multi-layered authentication with cryptographic token rotation. We will never ask you for your account password or unhashed OTP codes via email or chat.
              </div>
            </section>

            <section id="intellectual-property" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>3</span>
                Intellectual Property & Creator Rights
              </h2>
              <p className={styles.paragraph}>
                All creative assets—including manga panels, cover illustrations, original character designs, translations, logos, trademarks, and reader interface software—are the intellectual property of KuroYomi Platform Inc., our partnered mangaka, authors, publishers, or licensors.
              </p>
              <p className={styles.paragraph}>
                When you unlock or purchase access to a chapter or volume, you obtain a limited, non-exclusive, revocable, non-transferable personal license to view the designated content online via the KuroYomi Reader. You may NOT:
              </p>
              <ul className={styles.list}>
                <li>Rip, scrape, capture, or systematically extract chapter image assets or canvas streams.</li>
                <li>Redistribute, resell, mirror, re-translate, or re-publish our protected media onto third-party sites or torrent aggregators.</li>
                <li>Bypass digital rights management (DRM) or tamper with image delivery watermarks.</li>
              </ul>
            </section>

            <section id="coin-purchases" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>4</span>
                Sandboxed Coins, Pricing & Digital Unlocks
              </h2>
              <p className={styles.paragraph}>
                KuroYomi utilizes virtual tokens known as <strong>KuroYomi Coins</strong> to facilitate chapter unlocks and volume acquisitions.
              </p>
              <ul className={styles.list}>
                <li><strong>Sandbox Simulation:</strong> In demo and testing environments, coin transactions operate under sandbox mode with simulated billing flows.</li>
                <li><strong>Permanency of Unlocks:</strong> Once a chapter or book is unlocked with coins, it remains permanently accessible under your account's "My Library" catalog, provided the account remains in good standing.</li>
                <li><strong>Non-Refundable:</strong> Virtual coins spent on chapter views or immediate reading rights are final and non-refundable once content streaming has begun.</li>
              </ul>
              <div className={`${styles.calloutBox} ${styles.calloutSuccess}`}>
                For exhaustive information regarding coin packages, gift incentives, and simulated ledger balances, refer to our dedicated <a href="/coin-policy" style={{ color: 'var(--color-brand-primary)', fontWeight: 'bold' }}>Sandboxed Coin Policies</a>.
              </div>
            </section>

            <section id="acceptable-use" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>5</span>
                Acceptable Use Policy
              </h2>
              <p className={styles.paragraph}>
                We are dedicated to maintaining an enjoyable, safe environment for manga enthusiasts. When interacting with comments, reading communities, or reader reviews, users agree not to:
              </p>
              <ul className={styles.list}>
                <li>Post defamatory, obscene, harassing, hate speech, or sexually explicit unrated comments.</li>
                <li>Distribute malicious scripts, exploits, bot automations, or denial-of-service payloads against our servers.</li>
                <li>Attempt unauthorized privilege escalation into the KuroYomi Creator Studio or Admin CMS.</li>
              </ul>
            </section>

            <section id="termination" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>6</span>
                Account Suspension & Termination
              </h2>
              <p className={styles.paragraph}>
                We reserve the right to suspend or terminate user accounts, invalidate active sessions, or restrict access to reader assets without prior notice if fraudulent activity, abuse of OTP verification, or copyright infringement is detected.
              </p>
            </section>

            <section id="disclaimers" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>7</span>
                Warranty Disclaimers & Limitation of Liability
              </h2>
              <p className={styles.paragraph}>
                KuroYomi is provided on an "as is" and "as available" basis. While we strive for 99.9% reader uptime and ultra-fast image caching, we do not warrant that service will be uninterrupted, error-free, or entirely resilient to third-party telecommunication disruptions.
              </p>
            </section>

            <section id="contact" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>8</span>
                Inquiries & Legal Notices
              </h2>
              <p className={styles.paragraph}>
                For inquiries, copyright concerns, DMCA takedown requests, or questions regarding these Terms, contact our legal counsel via email at <a href="mailto:legal@kuroyomi.com" style={{ color: 'var(--color-brand-primary)' }}>legal@kuroyomi.com</a> or visit our <a href="/support" style={{ color: 'var(--color-brand-primary)' }}>Contact Support</a> page.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
