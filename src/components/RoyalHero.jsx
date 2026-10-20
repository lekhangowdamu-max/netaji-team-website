export default function RoyalHero({
  eyebrow = 'Netaji Subhash Chandra Bose Yuvakara Sangha',
  title = 'Our Unity. Our Heritage. Our Pride.',
  description = 'A community united by culture, service, and the spirit of Netaji.',
}) {
  return (
    <section className="royal-hero">
      <div className="royal-hero-content">
        <span className="royal-hero-eyebrow">{eyebrow}</span>

        <div className="royal-hero-ornament">
          ✦ ━━━━━ ✦
        </div>

        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}