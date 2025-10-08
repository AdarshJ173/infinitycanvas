import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Brain, Zap, Database, Link2, CheckCircle2, Sparkles, Network, BookOpen, FileText, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

export function OnboardingPage() {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section with Animated Background */}
      <section className="relative h-screen">
        {/* Background Animation Layer */}
        <div className="absolute inset-0 z-0">
          <BackgroundGradientAnimation
            containerClassName="w-full h-full"
            className="w-full h-full"
          />
        </div>
        
        {/* Transparent Floating Navigation Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-6"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logoNobg.svg" 
                alt="Neuron Logo" 
                className="h-10 sm:h-12 w-auto drop-shadow-lg"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-md">
                Neuron
              </span>
            </div>
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10 backdrop-blur-sm bg-background/10"
            >
              Get Started
            </Button>
          </div>
        </motion.header>
        
        {/* Content Layer */}
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full px-4 sm:px-8 py-12 sm:py-20">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer}
              >
                {/* Brain Flow Animation */}
                <motion.div 
                  variants={fadeInUp}
                  className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-12 sm:mb-16"
                >
                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(231,138,83,0.3)",
                            "0 0 40px rgba(231,138,83,0.6)",
                            "0 0 20px rgba(231,138,83,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                      >
                        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </motion.div>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground mt-2">Your Brain</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
                  </motion.div>

                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center"
                    >
                      <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-background" />
                    </motion.div>
                    <span className="text-xs sm:text-sm text-muted-foreground mt-2">Internet</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
                  </motion.div>

                  <motion.div 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(95,135,135,0.3)",
                            "0 0 40px rgba(95,135,135,0.6)",
                            "0 0 20px rgba(95,135,135,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center"
                      >
                        <Database className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-5 h-5 text-primary" />
                      </motion.div>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground mt-2">Second Brain</span>
                  </motion.div>
                </motion.div>

                {/* Main Headlines */}
                <motion.h1 
                  variants={fadeInUp}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    Stop Forgetting Everything You Learn
                  </span>
                </motion.h1>

                <motion.h2 
                  variants={fadeInUp}
                  className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 sm:mb-8 text-foreground"
                >
                  Build Your Digital Second Brain
                </motion.h2>

                <motion.p 
                  variants={fadeInUp}
                  className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4"
                >
                  Transform scattered knowledge into connected intelligence. 
                  Neuron combines <span className="text-primary font-semibold">Miro's visual workspace</span> + <span className="text-secondary font-semibold">ChatGPT's AI</span> + <span className="text-accent-foreground font-semibold">Notion's organization</span> into one powerful learning platform that remembers everything for you.
                </motion.p>

                <motion.div variants={fadeInUp}>
                  <Button
                    onClick={() => navigate('/home')}
                    size="lg"
                    className="text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                  >
                    Build My Second Brain
                    <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-20 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-destructive">
              Traditional Learning is Broken
            </h3>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Remember that brilliant insight from last month's tutorial? Neither do we. And that's the problem.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {[
              { icon: "📉", text: "You forget 70% of what you learn within 24 hours" },
              { icon: "🔒", text: "Knowledge stays siloed, never connects" },
              { icon: "💀", text: "Notes disappear into digital graveyards" },
              { icon: "🔄", text: "You re-learn the same concepts repeatedly" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4 sm:p-6 border-destructive/20 hover:border-destructive/40 transition-colors bg-card/50 backdrop-blur">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="text-3xl sm:text-4xl">{item.icon}</span>
                    <p className="text-base sm:text-lg text-foreground pt-1 sm:pt-2">{item.text}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Neuron Changes Everything
              </span>
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { 
                icon: <Layers className="w-8 h-8 sm:w-10 sm:h-10" />, 
                title: "Visual Knowledge Canvas",
                description: "See your entire learning journey in one beautiful, interactive space"
              },
              { 
                icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />, 
                title: "AI That Knows Your Context",
                description: "Get answers using YOUR uploaded materials, not generic internet knowledge"
              },
              { 
                icon: <Link2 className="w-8 h-8 sm:w-10 sm:h-10" />, 
                title: "Connect Ideas Across Domains",
                description: "Python + Finance = Quantitative Trading. Watch concepts merge magically"
              },
              { 
                icon: <Database className="w-8 h-8 sm:w-10 sm:h-10" />, 
                title: "Never Forget Again",
                description: "Your digital brain grows stronger daily, compounding your knowledge"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 sm:p-8 border-primary/20 hover:border-primary/40 transition-all bg-gradient-to-br from-card to-card/50 backdrop-blur h-full">
                  <div className="text-primary mb-4">{item.icon}</div>
                  <h4 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">{item.title}</h4>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Stories */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-20 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
              Real Learning Breakthroughs
            </h3>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            {[
              {
                name: "Sarah",
                role: "Software Developer",
                story: "Uploaded 50 Python tutorials to her canvas. When she asked 'How do I build a web scraper?', Neuron connected concepts from her uploaded docs, giving her a personalized answer in her learning style.",
                icon: <FileText className="w-6 h-6" />
              },
              {
                name: "Marcus",
                role: "Finance Student",
                story: "Connected his finance textbooks, lecture videos, and notes. His AI tutor helped him understand derivatives by linking concepts he already knew from calculus and economics.",
                icon: <BookOpen className="w-6 h-6" />
              },
              {
                name: "Dr. Chen",
                role: "Research Scientist",
                story: "Built her research canvas over 6 months. Now when she encounters new papers, Neuron instantly shows connections to her entire knowledge base.",
                icon: <Network className="w-6 h-6" />
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 sm:p-8 border-secondary/20 hover:border-secondary/40 transition-colors bg-card/50 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
                      {story.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl sm:text-2xl font-bold mb-1 text-foreground">{story.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{story.role}</p>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic">
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
      <section className="relative px-4 sm:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-foreground">
              Why Neuron Wins
            </h3>
          </motion.div>

          <div className="space-y-4">
            {[
              { vs: "Unlike ChatGPT", benefit: "Remembers YOUR knowledge forever" },
              { vs: "Unlike Notion", benefit: "Visual + AI-powered connections" },
              { vs: "Unlike Miro", benefit: "AI teaching assistant built-in" },
              { vs: "Unlike Memory Apps", benefit: "Context-aware intelligence" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 via-card to-secondary/10 border-primary/20">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                    <p className="text-base sm:text-lg">
                      <span className="text-muted-foreground">{item.vs}</span>
                      <span className="mx-2">→</span>
                      <span className="text-foreground font-semibold">{item.benefit}</span>
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 sm:p-12 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/30">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Your Second Brain Awaits
              </h3>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                While others forget 70% of what they learn, Neuron users build compound knowledge that grows exponentially. 
                <span className="block mt-2 text-foreground font-semibold">Every day you wait is knowledge lost forever.</span>
              </p>
              <Button
                onClick={() => navigate('/home')}
                size="lg"
                className="text-xl px-12 py-6 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl transform hover:scale-105 transition-all duration-300 group"
              >
                Start Building Now
                <Sparkles className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
