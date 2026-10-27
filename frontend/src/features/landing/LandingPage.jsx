import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Terminal, Brain, Fingerprint, ArrowRight } from 'lucide-react';
export const LandingPage = () => {
    return (<div className="min-h-screen bg-[#fbf9f0] text-[#1b1c17] flex flex-col selection:bg-[#c6f26a] selection:text-[#141f00]">
      {/* Navigation */}
      <nav className="h-20 border-b border-[#c6c7c0] bg-[#ffffff]/90 backdrop-blur-md sticky top-0 z-50 px-8 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="PrepPulse Logo" className="w-9 h-9 rounded-md object-contain"/>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl text-[#1b1c17] tracking-tight">PrepPulse</span>
            <span className="font-mono text-[10px] text-[#767871] font-semibold uppercase tracking-wider">Precision Suite</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#454742]">
          <a href="#features" className="hover:text-[#1b1c17] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#1b1c17] transition-colors">Methodology</a>
          <a href="#preview" className="hover:text-[#1b1c17] transition-colors">System Preview</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="secondary" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Start Practising</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 lg:px-16 pt-20 pb-24 border-b border-[#c6c7c0] max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#ffffff] border border-[#c6c7c0] rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4b6700] animate-pulse"></span>
            <span className="font-mono text-xs text-[#454742] uppercase tracking-wider">
              Autonomous Llama-3 Calibration Core Active
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#1b1c17] leading-tight">
            Practice Smarter. <br className="hidden sm:inline"/>
            <span className="underline decoration-[#c6f26a] decoration-4 underline-offset-8">Perform Stronger.</span>
          </h1>

          <p className="font-body text-lg sm:text-xl text-[#454742] max-w-2xl leading-relaxed">
            PrepPulse is an intelligent, AI-powered interview preparation and evaluation platform. Master high-stakes technical, architectural, and behavioral rounds with surgical precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button variant="primary" size="lg" className="shadow-sm">
                <span>Launch Mock Interview</span>
                <ArrowRight className="w-4 h-4 ml-1"/>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                <span>View Live Dashboard</span>
              </Button>
            </Link>
          </div>

          {/* Core Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 text-xs font-mono text-[#767871] border-t border-[#c6c7c0]/60 w-full mt-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl font-bold text-[#1b1c17]">94%</span>
              <span>CALIBRATION ACCURACY</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl font-bold text-[#1b1c17]">10+</span>
              <span>LANGGRAPH WORKFLOW NODES</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl font-bold text-[#1b1c17]">1.4s</span>
              <span>AVERAGE EVALUATION LATENCY</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-2xl font-bold text-[#1b1c17]">100%</span>
              <span>PRIVATE &amp; SCOPED DATA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section: Learning Loop */}
      <section id="how-it-works" className="px-8 lg:px-16 py-20 border-b border-[#c6c7c0] bg-[#ffffff]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-2 mb-12">
            <span className="font-mono text-xs text-[#767871] uppercase tracking-wider font-semibold">The Closed Learning Loop</span>
            <h2 className="font-display text-3xl font-bold text-[#1b1c17] tracking-tight">
              From Practice to Mastery
            </h2>
            <p className="text-[#454742] text-sm max-w-xl">
              Generic question banks test rote memorization. PrepPulse executes a rigorous five-step feedback loop that transforms weaknesses into core strengths.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
            { step: '01', title: 'Practice', desc: 'Real-time mock interviews with timed STDIN and Java sandbox environments.' },
            { step: '02', title: 'Evaluate', desc: 'Granular scoring on Technical Accuracy, Relevance, Completeness, and Clarity.' },
            { step: '03', title: 'Understand', desc: 'Deconstruct strengths, missing trade-offs, and compare with staff-level model answers.' },
            { step: '04', title: 'Improve', desc: 'Receive AI Coach prescriptions with 10-minute targeted focus drills.' },
            { step: '05', title: 'Master', desc: 'Track your Interview DNA progression and climb the interactive Skill Tree.' }
        ].map((item, idx) => (<div key={idx} className="p-5 border border-[#c6c7c0] rounded-xl bg-[#fbf9f0] flex flex-col justify-between">
                <span className="font-mono text-lg font-bold text-[#4b6700]">{item.step}</span>
                <div className="mt-4">
                  <h3 className="font-display text-lg font-bold text-[#1b1c17]">{item.title}</h3>
                  <p className="text-xs text-[#454742] mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>))}
          </div>
        </div>
      </section>

      {/* Product Features Grid */}
      <section id="features" className="px-8 lg:px-16 py-20 border-b border-[#c6c7c0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-2 mb-12">
            <span className="font-mono text-xs text-[#767871] uppercase tracking-wider font-semibold">Intelligence Architecture</span>
            <h2 className="font-display text-3xl font-bold text-[#1b1c17] tracking-tight">
              Engineered for Surgical Interview Readiness
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#ffffff] border border-[#c6c7c0] rounded-xl flex flex-col gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#c6f26a] flex items-center justify-center text-[#141f00]">
                <Terminal className="w-5 h-5"/>
              </div>
              <h3 className="font-display text-lg font-bold text-[#1b1c17]">Interview Arena</h3>
              <p className="text-sm text-[#454742] leading-relaxed">
                Realistic single-question cockpit with Markdown text editor, live code sandbox (Java 21), word count threshold indicators, and detected signal chips.
              </p>
            </div>

            <div className="p-6 bg-[#ffffff] border border-[#c6c7c0] rounded-xl flex flex-col gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#1a1c18] flex items-center justify-center text-[#c6f26a]">
                <Brain className="w-5 h-5"/>
              </div>
              <h3 className="font-display text-lg font-bold text-[#1b1c17]">AI Coach Prescriptions</h3>
              <p className="text-sm text-[#454742] leading-relaxed">
                Recommends targeted focus sprints based strictly on your historical evaluations. Identifies weak topics like G1GC vs ZGC tuning or 2PC vs Sagas.
              </p>
            </div>

            <div className="p-6 bg-[#ffffff] border border-[#c6c7c0] rounded-xl flex flex-col gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#eae8df] flex items-center justify-center text-[#1b1c17]">
                <Fingerprint className="w-5 h-5"/>
              </div>
              <h3 className="font-display text-lg font-bold text-[#1b1c17]">Interview DNA</h3>
              <p className="text-sm text-[#454742] leading-relaxed">
                Multi-axis radar breakdown visualizing Technical Depth, Relevance, Completeness, Structure, and Operational Trade-offs benchmarked against cohort baselines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-8 lg:px-16 py-10 bg-[#1b1c17] text-[#dfe4d8] border-t border-[#30312b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="PrepPulse" className="w-7 h-7 rounded"/>
            <span className="font-display font-bold text-lg text-white">PrepPulse</span>
            <span className="text-xs text-[#80867b]">· Intelligent Interview Evaluation Platform</span>
          </div>

          <div className="text-xs text-[#80867b] font-mono">
            Crafted for MCA Major Project · Google Stitch Design System Reference
          </div>
        </div>
      </footer>
    </div>);
};
