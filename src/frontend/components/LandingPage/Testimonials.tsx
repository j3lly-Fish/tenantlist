import React from 'react';
import styles from './Testimonials.module.css';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
}

/**
 * Testimonials Component
 *
 * Landing page section showing user testimonials:
 * - "Hear It From Our Users" heading
 * - 3 testimonial cards with quote, name, role, optional avatar
 */
export const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      quote: "ZYX transformed how we find retail spaces. Within two weeks, we had three landlords competing for our business. The process was seamless.",
      name: 'Sarah Chen',
      role: 'Franchise Developer',
      company: 'Quick Bites Inc.',
    },
    {
      quote: "As a landlord with multiple properties, this platform has been a game-changer. I'm connecting with qualified tenants who actually match my spaces.",
      name: 'Michael Rodriguez',
      role: 'Property Owner',
      company: 'Rodriguez Holdings',
    },
    {
      quote: "The matching algorithm saved my team countless hours. We closed 40% more deals last quarter thanks to the quality leads from ZYX.",
      name: 'Jennifer Walsh',
      role: 'Senior Broker',
      company: 'CBRE',
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="testimonials-title" className={styles.title}>
            Hear It From Our Users
          </h2>
          <p className={styles.subtitle}>
            See how real estate professionals are succeeding with our platform
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <article key={index} className={styles.testimonialCard}>
              {/* Quote Icon */}
              <div className={styles.quoteIcon} aria-hidden="true">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.768-.695-1.327-.825-.55-.13-1.07-.14-1.54-.03-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l-.007.003z" />
                </svg>
              </div>

              {/* Quote Text */}
              <blockquote className={styles.quote}>
                "{testimonial.quote}"
              </blockquote>

              {/* Author Info */}
              <div className={styles.author}>
                {/* Avatar */}
                <div className={styles.avatar}>
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt=""
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {testimonial.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Name and Role */}
                <div className={styles.authorInfo}>
                  <p className={styles.authorName}>{testimonial.name}</p>
                  <p className={styles.authorRole}>
                    {testimonial.role}
                    {testimonial.company && `, ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
