import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Zap, Shield, BarChart3, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Smart AI Replies', description: 'Generate professional, on-brand responses to every review in seconds.' },
  { icon: Zap, title: 'Auto-Reply Rules', description: 'Set rules to automatically respond based on rating, keywords, and tone.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track review trends, response rates, and customer sentiment over time.' },
  { icon: Globe, title: 'Multi-Location', description: 'Manage reviews across all your business locations from one dashboard.' },
  { icon: Shield, title: 'Brand Safety', description: 'Built-in guardrails ensure replies stay professional and compliant.' },
  { icon: Star, title: 'Review Monitoring', description: 'Get instant alerts when new reviews come in — never miss feedback.' },
];

const pricingPlans = [
  { name: 'Starter', price: '$29', period: '/mo', description: 'For small businesses', features: ['1 location', 'AI reply suggestions', 'Email notifications', 'Basic analytics'] },
  { name: 'Pro', price: '$79', period: '/mo', description: 'For growing businesses', features: ['Up to 10 locations', 'Auto-reply rules', 'Priority support', 'Advanced analytics'], popular: true },
  { name: 'Agency', price: '$199', period: '/mo', description: 'For agencies & enterprises', features: ['Unlimited locations', 'White-label option', 'API access', 'Dedicated support'] },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Star className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ReviewFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> AI-Powered Review Management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
              Manage reviews. <br className="hidden sm:block" />
              <span className="text-primary">Reply smarter.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              ReviewFlow helps businesses respond to Google reviews instantly with AI-generated replies, saving hours every week while keeping customers happy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register">Start Free Trial <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <a href="#features">See How It Works</a>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need to manage reviews</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Streamline your review management workflow from monitoring to replying — all in one place.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`bg-card rounded-xl border p-6 flex flex-col ${plan.popular ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary' : 'border-border'}`}>
                {plan.popular && <span className="text-xs font-semibold text-primary mb-3">MOST POPULAR</span>}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? 'default' : 'outline'} className="w-full" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to take control of your reviews?</h2>
          <p className="text-primary-foreground/80 mb-8">Join thousands of businesses using ReviewFlow to manage their online reputation.</p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
            <Link to="/register">Start Your Free Trial <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Star className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ReviewFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ReviewFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
