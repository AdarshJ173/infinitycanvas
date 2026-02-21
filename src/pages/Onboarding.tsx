import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Brain, Zap, Database, Link2, CheckCircle2, Sparkles, Network, BookOpen, FileText, Layers, TrendingDown, Lock, Archive, RefreshCw, Lightbulb, Target, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

export function OnboardingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const problemRef = useRef<HTMLElement>(null);
  const solutionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-[100]"
        style={{ scaleX: smoothProgress, transformOrigin: "0%" }}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <BackgroundGradientAnimation
            containerClassName="w-full h-full"
            className="w-full h-full"
          />
        </motion.div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-6"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logoNobg.svg" 
                alt="Neuron Logo" 
                className="h-10 sm:h-12 w-auto"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Neuron
              </span>
            </div>
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10 backdrop-blur-sm"
            >
              Get Started
            </Button>
          </div>
        </motion.header>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full px-4 sm:px-8 py-12 sm:py-20">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer}
              >
                {/* Flow Visualization */}
                <motion.div 
                  variants={fadeInUp}
                  className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mb-16"
                >
                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 30px rgba(231,138,83,0.2)",
                            "0 0 60px rgba(231,138,83,0.4)",
                            "0 0 30px rgba(231,138,83,0.2)"
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
                      >
                        <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                      </motion.div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground mt-3">Your Mind</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-primary/40"
                  >
                    <ArrowRight className="w-8 h-8" />
                  </motion.div>

                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center border border-primary/20"
                    >
                      <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-background" />
                    </motion.div>
                    <span className="text-sm font-medium text-muted-foreground mt-3">Digital Networks</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="text-primary/40"
                  >
                    <ArrowRight className="w-8 h-8" />
                  </motion.div>

                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 30px rgba(95,135,135,0.2)",
                            "0 0 60px rgba(95,135,135,0.4)",
                            "0 0 30px rgba(95,135,135,0.2)"
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center border border-secondary/20"
                      >
                        <Database className="w-10 h-10 sm:w-12 sm:h-12 text-secondary" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2"
                      >
                        <Sparkles className="w-6 h-6 text-primary" />
                      </motion.div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground mt-3">Second Brain</span>
                  </motion.div>
                </motion.div>

                {/* Main Headlines */}
                <motion.h1 
                  variants={fadeInUp}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]"
                >
                  <span className="bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
                    Stop Losing What You Learn
                  </span>
                </motion.h1>

                <motion.h2 
                  variants={fadeInUp}
                  className="text-2xl sm:text-3xl md:text-4xl font-medium mb-8 text-foreground/80"
                >
                  Build Your Digital Second Brain
                </motion.h2>

                <motion.p 
                  variants={fadeInUp}
                  className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed px-4"
                >
                  Transform fragmented knowledge into connected intelligence. Neuron combines visual workspace, 
                  contextual AI, and systematic organization into one powerful platform that remembers everything so you don't have to.
                </motion.p>

                <motion.div variants={fadeInUp}>
                  <Button
                    onClick={() => navigate('/home')}
                    size="lg"
                    className="text-lg px-10 py-7 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 group"
                  >
                    Build Your Second Brain
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-muted-foreground/50"
          >
            <span className="text-xs uppercase tracking-widest mb-2">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section with Parallax */}
      <section ref={problemRef} className="relative px-4 sm:px-8 py-24 sm:py-32 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              <span>The Problem</span>
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Traditional Learning is Broken
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The human brain naturally forgets information over time. Without a systematic approach, 
              your learning efforts produce diminishing returns.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { 
                icon: <TrendingDown className="w-6 h-6" />, 
                title: "Rapid Information Decay",
                description: "Research shows that 70% of new information is forgotten within 24 hours without active reinforcement."
              },
              { 
                icon: <Lock className="w-6 h-6" />, 
                title: "Knowledge Silos",
                description: "Information stays disconnected across different platforms, preventing the formation of meaningful insights."
              },
              { 
                icon: <Archive className="w-6 h-6" />, 
                title: "Digital Graveyards",
                description: "Valuable notes and resources disappear into folders, never to be seen or utilized again."
              },
              { 
                icon: <RefreshCw className="w-6 h-6" />, 
                title: "Redundant Learning",
                description: "Without memory systems, you're forced to re-learn the same concepts multiple times."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 sm:p-8 border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive/20 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section ref={solutionRef} className="relative px-4 sm:px-8 py-24 sm:py-32 bg-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Lightbulb className="w-4 h-4" />
              <span>The Solution</span>
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Neuron Changes Everything
              </span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive system designed to capture, connect, and retain your knowledge for life.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { 
                icon: <Layers className="w-8 h-8" />, 
                title: "Visual Knowledge Canvas",
                description: "Map your entire learning journey in one interconnected, interactive space. See the big picture and the details simultaneously."
              },
              { 
                icon: <Sparkles className="w-8 h-8" />, 
                title: "Contextual AI Assistant",
                description: "Get intelligent answers using your own materials and knowledge base, not generic information from the web."
              },
              { 
                icon: <Link2 className="w-8 h-8" />, 
                title: "Cross-Domain Connections",
                description: "Watch as concepts from different fields merge into new insights. Finance meets coding. Art meets science."
              },
              { 
                icon: <Database className="w-8 h-8" />, 
                title: "Permanent Knowledge Storage",
                description: "Build a digital brain that grows stronger over time, compounding your intellectual investments indefinitely."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Card className="p-8 border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-card to-card/50 h-full group">
                  <div className="text-primary mb-5 group-hover:scale-110 transition-transform duration-300 w-fit">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-foreground">{item.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Stories */}
      <section className="relative px-4 sm:px-8 py-24 sm:py-32 bg-gradient-to-b from-background via-card/20 to-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Real Results
            </h3>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                name: "Sarah Chen",
                role: "Software Developer",
                story: "After uploading 50 Python tutorials to her canvas, Sarah asked how to build a web scraper. Neuron connected concepts from her existing documentation, delivering a personalized solution in her learning style.",
                icon: <FileText className="w-6 h-6" />
              },
              {
                name: "Marcus Webb",
                role: "Finance Graduate Student",
                story: "By connecting finance textbooks, lecture videos, and personal notes, Marcus's AI tutor helped him understand complex derivatives by linking concepts from his calculus and economics background.",
                icon: <BookOpen className="w-6 h-6" />
              },
              {
                name: "Dr. Emily Chen",
                role: "Research Scientist",
                story: "Over 6 months, she built a comprehensive research canvas. Now when encountering new papers, Neuron instantly reveals connections to her entire knowledge base, accelerating her literature review.",
                icon: <Network className="w-6 h-6" />
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 border-secondary/20 hover:border-secondary/40 transition-colors bg-card/50 backdrop-blur">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
                      {story.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1 text-foreground">{story.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 font-medium">{story.role}</p>
                      <p className="text-muted-foreground leading-relaxed">
        "{story.story}"
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Differentiation */}
      <section className="relative px-4 sm:px-8 py-24 sm:py-32 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Why Neuron Wins
            </h3>
          </motion.div>

          <div className="space-y-4">
            {[
              { vs: "ChatGPT", benefit: "Permanent memory of YOUR knowledge" },
              { vs: "Notion", benefit: "Visual canvas with AI connections" },
              { vs: "Miro", benefit: "Built-in intelligent teaching assistant" },
              { vs: "Memory Apps", benefit: "Deep context-aware intelligence" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="p-5 sm:p-6 bg-gradient-to-r from-primary/5 via-card to-secondary/5 border-primary/10">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <p className="text-base sm:text-lg">
                      <span className="text-muted-foreground font-medium">{item.vs}</span>
                      <span className="mx-3 text-primary/40">→</span>
                      <span className="text-foreground font-semibold">{item.benefit}</span>
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-4 sm:px-8 py-20 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "70%", label: "Information Lost", icon: <TrendingDown className="w-5 h-5" /> },
              { value: "3x", label: "Faster Learning", icon: <Zap className="w-5 h-5" /> },
              { value: "10K+", label: "Connections Made", icon: <Link2 className="w-5 h-5" /> },
              { value: "100%", label: "Knowledge Retained", icon: <Database className="w-5 h-5" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-3 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 sm:px-8 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="p-10 sm:p-14 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
              <div className="relative">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Second Brain Awaits
                </h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                  While others lose 70% of what they learn, Neuron users build compounding knowledge 
                  that grows exponentially. Every day you wait is potential insight lost forever.
                </p>
                <Button
                  onClick={() => navigate('/home')}
                  size="lg"
                  className="text-xl px-12 py-7 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 group"
                >
                  Start Building Now
                  <Sparkles className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-8 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logoNobg.svg" alt="Neuron" className="h-6 w-auto" />
            <span className="text-sm text-muted-foreground">Neuron</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for lifelong learners
          </p>
        </div>
      </footer>
    </div>
  );
}
