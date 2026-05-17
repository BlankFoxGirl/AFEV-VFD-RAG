import './HomePage.css';

const FEATURES = [
  {
    id: 'dashboard',
    icon: '📊',
    name: 'Dashboard',
    description:
      "Get a bird\u2019s-eye view of your data with real-time metrics and interactive charts.",
  },
  {
    id: 'features',
    icon: '⚡',
    name: 'Features',
    description:
      'Explore a rich set of tools designed to streamline your workflow and boost productivity.',
  },
  {
    id: 'resources',
    icon: '📚',
    name: 'Resources',
    description:
      'Access guides, tutorials, and documentation to get the most out of the application.',
  },
];

function WelcomeSection() {
  return (
    <section className="home-page__welcome" aria-labelledby="welcome-heading">
      <h1 id="welcome-heading" className="home-page__welcome-heading">
        Welcome to My App
      </h1>
      <p className="home-page__welcome-subheading">
        Your all-in-one platform for managing data, exploring features, and
        staying productive.
      </p>
      <a className="home-page__welcome-cta" href="/dashboard">
        Get Started
      </a>
    </section>
  );
}

function OverviewSection() {
  return (
    <section className="home-page__overview" aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="home-page__section-title">
        Application Overview
      </h2>
      <p className="home-page__overview-description">
        My App brings together powerful tools in a clean, intuitive interface.
        Whether you're monitoring performance, managing resources, or
        collaborating with your team, everything you need is just a click away.
      </p>
    </section>
  );
}

function FeatureCard({ icon, name, description }) {
  return (
    <article className="home-page__feature-card">
      <div className="home-page__feature-icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="home-page__feature-name">{name}</h3>
      <p className="home-page__feature-description">{description}</p>
    </article>
  );
}

function FeaturesSection() {
  return (
    <section className="home-page__features" aria-labelledby="features-heading">
      <h2 id="features-heading" className="home-page__features-title">
        Feature Highlights
      </h2>
      <div className="home-page__features-grid">
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.id}
            icon={feature.icon}
            name={feature.name}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <div>
      <WelcomeSection />
      <OverviewSection />
      <FeaturesSection />
    </div>
  );
}

export default HomePage;
