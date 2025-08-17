import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  FileText, 
  Upload, 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  CheckCircle,
  Menu,
  X
} from "lucide-react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">AI Talent Match</h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="#features" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    How It Works
                  </a>
                  <a href="#pricing" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    Pricing
                  </a>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6 space-x-3">
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="button-get-started">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary">
                  Features
                </a>
                <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary">
                  How It Works
                </a>
                <a href="#pricing" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary">
                  Pricing
                </a>
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start" data-testid="mobile-sign-in">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full justify-start" data-testid="mobile-get-started">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                AI-Powered Job Matching That{" "}
                <span className="text-blue-200">Actually Works</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Advanced semantic search and hybrid ranking algorithm connects the right talent with the right opportunities. 
                No more endless scrolling through irrelevant matches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register?role=seeker">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-gray-100 flex items-center justify-center"
                    data-testid="button-job-seeker-signup"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    I'm Looking for Jobs
                  </Button>
                </Link>
                <Link href="/register?role=recruiter">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-primary flex items-center justify-center"
                    data-testid="button-recruiter-signup"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    I'm Hiring Talent
                  </Button>
                </Link>
              </div>
              <div className="flex items-center text-blue-200 text-sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Free to start • No credit card required • 2-minute setup</span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600"
                alt="Professional using AI job matching platform"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              <Card className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-lg">
                <CardContent className="p-3">
                  <div className="text-primary font-bold text-lg" data-testid="text-match-accuracy">98%</div>
                  <div className="text-gray-600 text-xs">Match Accuracy</div>
                </CardContent>
              </Card>
              <Card className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm shadow-lg">
                <CardContent className="p-3">
                  <div className="text-accent font-bold text-lg" data-testid="text-hiring-speed">2.5x</div>
                  <div className="text-gray-600 text-xs">Faster Hiring</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Powered by Advanced AI & Machine Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our hybrid ranking system combines semantic search, natural language processing, 
              and intelligent scoring to deliver unprecedented matching accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="feature-card-blue border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">Semantic Understanding</h3>
                <p className="text-gray-600 mb-4">
                  Advanced NLP analyzes context and meaning, not just keywords. 
                  Understands skill relationships and job requirements deeply.
                </p>
                <div className="text-sm text-primary font-medium">
                  <BarChart3 className="inline mr-1 h-4 w-4" />
                  spaCy + Sentence Transformers
                </div>
              </CardContent>
            </Card>

            <Card className="feature-card-green border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent text-white rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">Hybrid Scoring</h3>
                <p className="text-gray-600 mb-4">
                  Combines BM25 lexical search (40%) + semantic similarity (50%) + rule-based boosts (10%) for optimal results.
                </p>
                <div className="text-sm text-accent font-medium">
                  <Search className="inline mr-1 h-4 w-4" />
                  Elasticsearch + Vector Search
                </div>
              </CardContent>
            </Card>

            <Card className="feature-card-purple border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">Resume Intelligence</h3>
                <p className="text-gray-600 mb-4">
                  Automatically extracts skills, experience, and qualifications from PDF/DOCX files with high accuracy.
                </p>
                <div className="text-sm text-purple-600 font-medium">
                  <Upload className="inline mr-1 h-4 w-4" />
                  PDF + DOCX Processing
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Architecture */}
          <Card className="bg-gray-50">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-secondary mb-6 text-center">Real-Time Architecture</h3>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 bg-blue-100 text-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">React SPA</div>
                    <div className="text-xs text-gray-500">Frontend</div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">Django API</div>
                    <div className="text-xs text-gray-500">Backend</div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">Elasticsearch</div>
                    <div className="text-xs text-gray-500">Data Store</div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">ML Pipeline</div>
                    <div className="text-xs text-gray-500">AI Engine</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Everything You Need for Smart Hiring
            </h2>
            <p className="text-xl text-gray-600">
              Advanced features built for the modern recruitment workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Smart Resume Upload</h3>
                <p className="text-gray-600 text-sm">
                  PDF/DOCX parsing with automatic skill extraction and profile completion using advanced NLP.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent text-white rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Semantic Job Search</h3>
                <p className="text-gray-600 text-sm">
                  Find opportunities based on meaning and context, not just keywords. Understands skill relationships.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">AI Candidate Matching</h3>
                <p className="text-gray-600 text-sm">
                  Hybrid scoring algorithm ranks candidates with 98% accuracy using multiple intelligence factors.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Interview Scheduling</h3>
                <p className="text-gray-600 text-sm">
                  Integrated calendar with real-time availability sync and automated meeting link generation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-600 text-white rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Real-time Chat</h3>
                <p className="text-gray-600 text-sm">
                  WebSocket-powered messaging between recruiters and candidates with application context.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Advanced Analytics</h3>
                <p className="text-gray-600 text-sm">
                  Track hiring metrics, match success rates, and optimize your recruitment process with data insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your hiring needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-secondary mb-2">Starter</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-secondary">Free</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Up to 10 job applications</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Basic AI matching</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Resume upload & parsing</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Email notifications</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" data-testid="button-starter-plan">
                    Get Started Free
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Professional Tier */}
            <Card className="border-2 border-primary relative transform scale-105 shadow-xl">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-accent text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-8 bg-primary text-white">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$49</span>
                    <span className="text-blue-200">/month</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-sm">Unlimited applications</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-sm">Advanced AI ranking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-sm">Real-time chat</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-sm">Interview scheduling</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-sm">Analytics dashboard</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-white text-primary hover:bg-gray-100" data-testid="button-professional-plan">
                    Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-secondary mb-2">Enterprise</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-secondary">$199</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Everything in Professional</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Custom ML model training</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">API access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      <span className="text-sm">White-label options</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" data-testid="button-enterprise-plan">
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies already using AI-powered recruitment to find the best talent faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 flex-1" data-testid="button-start-free-trial">
                Start Free Trial
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary flex-1"
              data-testid="button-book-demo"
            >
              Book Demo
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            No credit card required • Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">AI Talent Match</h3>
              <p className="text-gray-300 mb-4 max-w-md">
                The most advanced AI-powered job matching platform. Connecting the right talent with the right opportunities through intelligent technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Users className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Search className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Brain className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-300">
            <p>&copy; 2024 AI Talent Match. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
