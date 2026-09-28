import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { 
  Headphones, 
  Mail, 
  Send, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import styles from './SupportPages.module.css';

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "I haven't received my 6-digit email OTP verification code. What should I do?",
    answer: "Check your spam or junk folder first. If still missing, return to the Login / Register screen and click 'Resend OTP Code'. Please ensure your email address was typed accurately without trailing spaces."
  },
  {
    question: "How do I toggle between continuous Vertical Scroll (Webtoon) and Single Page mode?",
    answer: "While reading any chapter in the KuroYomi Reader, click or tap the screen to bring up the reading navigation overlay. In the settings drawer, choose between 'Vertical Webtoon', 'Single Page', and 'Double Page Spread'."
  },
  {
    question: "How do Sandboxed Coins work?",
    answer: "In this demo version, all coin packages and billing orders are processed via a simulated sandbox payment engine. No real credit card charges occur, but your wallet ledger is accurately updated."
  },
  {
    question: "How can I publish my own manga or webtoon series on KuroYomi?",
    answer: "If you have an ADMIN or Creator account, simply navigate to Creator Studio (/admin) where you can use the Book Wizard, manage Volumes, and upload page assets directly."
  }
];

export const ContactSupport: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('account');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate ticket creation
    setTimeout(() => {
      const generatedId = `KY-${Math.floor(10000 + Math.random() * 90000)}`;
      setTicketId(generatedId);
      setIsSubmitting(false);
      // Reset fields
      setSubject('');
      setMessage('');
    }, 900);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Contact Support' }]} />

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <Headphones size={12} /> KuroYomi Help Desk
            </span>
            <span className={styles.metaText}>
              <Clock size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--color-status-success)' }} />
              Typical response time: under 2 hours
            </span>
          </div>
          <h1 className={styles.title}>Contact Support & Help Center</h1>
          <p className={styles.subtitle}>
            Have an issue with reader loading, coin purchases, or account verification? Our technical team and community are here to help.
          </p>
        </header>

        <div className={styles.contactLayout}>
          {/* Support Ticket Submission Form */}
          <section className={styles.supportFormCard}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '8px' }}>
              <MessageSquare size={20} color="var(--color-brand-primary)" />
              Submit a Support Request
            </h2>
            <p className={styles.paragraph} style={{ marginBottom: '24px' }}>
              Fill out the details below and a KuroYomi representative will review your inquiry.
            </p>

            {ticketId ? (
              <div 
                className={`${styles.calloutBox} ${styles.calloutSuccess}`} 
                style={{ padding: '24px 20px', borderRadius: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <CheckCircle2 size={24} color="#10B981" />
                  <strong style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>
                    Ticket Submitted Successfully!
                  </strong>
                </div>
                <p style={{ margin: '8px 0', fontSize: '13px' }}>
                  Your reference ticket number is: <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)' }}>{ticketId}</span>.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  A confirmation receipt and follow-up updates will be sent to <strong>{email}</strong> shortly.
                </p>
                <button 
                  onClick={() => setTicketId(null)}
                  className={styles.submitBtn}
                  style={{ marginTop: 16, padding: '8px 16px', fontSize: '12px' }}
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kenji Sato"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. reader@kuroyomi.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Inquiry Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="account">Account & OTP Verification</option>
                      <option value="reader">Reader & Page Rendering Bug</option>
                      <option value="wallet">Coins, Wallet & Transactions</option>
                      <option value="creator">Creator Studio & Uploads</option>
                      <option value="dmca">Copyright & Content Reporting</option>
                      <option value="other">General Question</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Urgency Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className={styles.selectField}
                    >
                      <option value="LOW">Low (General Query)</option>
                      <option value="NORMAL">Normal (Standard Assistance)</option>
                      <option value="HIGH">High (Blocked from Reading)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of the issue..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Detailed Message</label>
                  <textarea
                    required
                    placeholder="Please include any error messages, chapter numbers, or steps to reproduce..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={styles.textareaField}
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? (
                    'Transmitting Ticket...'
                  ) : (
                    <>
                      <Send size={16} /> Submit Support Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* Right Column: Direct Channels & FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Direct Channel Box */}
            <div className={styles.contactInfoBox}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Direct Channels</h3>

              <div className={styles.channelItem}>
                <div className={styles.channelIcon}>
                  <Mail size={18} />
                </div>
                <div className={styles.channelDetail}>
                  <h5>Helpdesk Email</h5>
                  <p>Inquiries regarding reader accounts & technical issues.</p>
                  <a href="mailto:support@kuroyomi.com">support@kuroyomi.com</a>
                </div>
              </div>

              <div className={styles.channelItem}>
                <div className={styles.channelIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                  <Sparkles size={18} />
                </div>
                <div className={styles.channelDetail}>
                  <h5>Creator Partnerships</h5>
                  <p>For independent mangaka, publishers, and studio licensing.</p>
                  <a href="mailto:creators@kuroyomi.com">creators@kuroyomi.com</a>
                </div>
              </div>

              <div className={styles.channelItem}>
                <div className={styles.channelIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                  <Headphones size={18} />
                </div>
                <div className={styles.channelDetail}>
                  <h5>Discord Community</h5>
                  <p>Connect with other readers and get real-time status alerts.</p>
                  <a href="https://discord.gg" target="_blank" rel="noreferrer">discord.gg/kuroyomi</a>
                </div>
              </div>
            </div>

            {/* Quick FAQs */}
            <div className={styles.faqSection}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 0 0' }}>
                Frequently Asked Questions
              </h3>

              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={styles.faqItem}>
                    <button 
                      type="button" 
                      onClick={() => toggleFaq(idx)}
                      className={styles.faqHeader}
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isOpen && (
                      <div className={styles.faqContent}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
