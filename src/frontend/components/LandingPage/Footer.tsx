import React from 'react';
import styles from './Footer.module.css';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Footer Component
 *
 * Landing page footer with link sections:
 * - Platform links: How It Works, Pricing, Our Users
 * - For Landlords: List Property, Resources
 * - Support: FAQ, Contact, Privacy Policy
 * - Copyright notice
 */
export const Footer: React.FC = () => {
  const sections: FooterSection[] = [
    {
      title: 'Platform',
      links: [
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Our Users', href: '#testimonials' },
      ],
    },
    {
      title: 'For Landlords',
      links: [
        { label: 'List Property', href: '#list-property' },
        { label: 'Resources', href: '#resources' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Contact', href: '#contact' },
        { label: 'Privacy Policy', href: '#privacy' },
      ],
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Main Footer Content */}
        <div className={styles.content}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.logo}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="40" height="40" rx="8" fill="#0F172A" />
                <path
                  d="M12 28V12L20 20L28 12V28"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.logoText}>ZYX Platform</span>
            </div>
            <p className={styles.tagline}>
              The demand-first marketplace for commercial real estate
            </p>
          </div>

          {/* Links Sections */}
          <div className={styles.linksContainer}>
            {sections.map((section, index) => (
              <div key={index} className={styles.linksSection}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <ul className={styles.linksList}>
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} className={styles.link}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            {currentYear} ZYX Platform. All rights reserved.
          </p>
          <div className={styles.socialLinks}>
            {/* LinkedIn */}
            <a
              href="#linkedin"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            {/* Twitter/X */}
            <a
              href="#twitter"
              className={styles.socialLink}
              aria-label="Twitter"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
