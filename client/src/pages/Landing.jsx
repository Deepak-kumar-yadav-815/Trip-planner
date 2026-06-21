import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, Receipt, MessageCircle, Bot, Mic, Sparkles, StickyNote, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { useRef } from "react";

// Subtle glow card component for the Bento grid
function GlowCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/30 p-8 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/80 hover:border-border ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen font-sans bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden">
          {/* Ultra-subtle ambient background */}
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3 }}
              className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50 dark:opacity-20" 
            />
            {/* Elegant faint dot pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==')] text-foreground/5 opacity-50" />
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center"
          >
            {/* Status Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md mb-8"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              Realtime Collaboration Platform
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-balance max-w-5xl leading-[1.1]"
            >
              Plan the Perfect Trip. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-sm">
                Together in Real-Time.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-[700px] text-lg md:text-xl text-muted-foreground font-medium text-balance leading-relaxed"
            >
              A revolutionary group travel workspace. Drop pins, split expenses, join live audio rooms, and build itineraries with your personal AI agent—all perfectly synced.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <SignedIn>
                <Link to="/home" className="group relative inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] transition-transform hover:scale-[1.05] active:scale-95">
                  Launch Workspace
                  <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="group relative inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] transition-transform hover:scale-[1.05] active:scale-95 cursor-pointer">
                    Start Planning Free
                    <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </SignInButton>
              </SignedOut>
            </motion.div>

            {/* High-Fidelity App Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-24 w-full max-w-6xl relative"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
               <div className="rounded-t-3xl border border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] flex flex-col relative group">
                 {/* Browser Header */}
                 <div className="h-10 border-b border-border/50 bg-muted/20 flex items-center px-4 gap-2">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-border/80"></div>
                   </div>
                   <div className="mx-auto w-48 h-5 bg-background/50 rounded-md border border-border/30 flex items-center justify-center">
                     <div className="w-24 h-2 bg-muted-foreground/20 rounded-full" />
                   </div>
                 </div>
                 
                 {/* Dashboard Layout */}
                 <div className="flex flex-1 overflow-hidden">
                   {/* Sidebar Skeleton */}
                   <div className="w-48 border-r border-border/50 bg-muted/10 p-4 hidden lg:flex flex-col gap-3">
                     <div className="w-full h-8 bg-primary/10 rounded-lg border border-primary/20 mb-4" />
                     {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-4 bg-foreground/5 rounded-md" />)}
                   </div>
                   
                   {/* Main Content */}
                   <div className="flex-1 flex flex-col relative bg-background/20">
                     {/* Map Topography Background */}
                     <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cGF0aCBkPSJNMTAwIDEwMFEyMDAgMCAzMDAgMTAwVDUwMCAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIi8+PC9zdmc+')] bg-cover" />
                     
                     <div className="flex-1 p-6 flex flex-col gap-4">
                       <div className="w-full h-1/2 rounded-2xl border border-border/50 bg-card/20 relative overflow-hidden flex items-center justify-center group-hover:border-primary/20 transition-colors duration-700">
                          {/* Animated Map Pin */}
                          <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
                          >
                            <div className="w-2 h-2 rounded-full bg-background" />
                          </motion.div>
                          {/* Map pulse */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-primary/30 animate-ping opacity-50" />
                       </div>
                       
                       <div className="flex gap-4 h-1/2">
                         <div className="flex-1 rounded-2xl border border-border/50 bg-card/30 p-5 flex flex-col gap-3">
                           <div className="h-4 w-24 bg-foreground/10 rounded-md" />
                           <div className="h-10 w-full bg-foreground/5 rounded-lg border border-border/30" />
                           <div className="h-10 w-full bg-foreground/5 rounded-lg border border-border/30" />
                         </div>
                         <div className="w-1/3 rounded-2xl border border-border/50 bg-card/40 p-4 flex flex-col justify-end gap-2 relative overflow-hidden">
                           {/* Chat Bubbles */}
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.9, originX: 1, originY: 1 }}
                             whileInView={{ opacity: 1, scale: 1 }}
                             className="self-end px-3 py-2 text-[10px] bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm max-w-[80%]"
                           >
                             <div className="w-16 h-1.5 bg-primary-foreground/50 rounded-full mb-1" />
                             <div className="w-12 h-1.5 bg-primary-foreground/30 rounded-full" />
                           </motion.div>
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.9, originX: 0, originY: 1 }}
                             whileInView={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 0.2 }}
                             className="self-start px-3 py-2 text-[10px] bg-muted text-foreground rounded-2xl rounded-bl-sm shadow-sm border border-border/50 max-w-[80%]"
                           >
                             <div className="w-20 h-1.5 bg-foreground/40 rounded-full mb-1" />
                             <div className="w-14 h-1.5 bg-foreground/20 rounded-full" />
                           </motion.div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </motion.div>
          </motion.div>
        </section>

        {/* TRUE BENTO GRID SECTION */}
        <section className="w-full py-32 bg-background relative z-20 border-t border-border/50">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance leading-tight">
                Everything you need to plan. <br className="hidden md:block"/>Nothing in your way.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground font-medium">
                Engineered with precision. Nine powerful features seamlessly integrated into one unified workspace.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[280px] gap-4 md:gap-6">
              
              {/* Feature 1 (Large Span) */}
              <GlowCard className="md:col-span-2 flex flex-col justify-between group/map border-blue-500/20" delay={0.1}>
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)] group-hover/map:scale-110 transition-transform">
                    <MapPin className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">Live Map Collaboration</h3>
                  <p className="text-muted-foreground font-medium max-w-md text-balance leading-relaxed">See exactly where everyone is on the interactive map. Drop location pins, track movements, and never lose a friend in a crowded city again.</p>
                </div>
              </GlowCard>

              {/* Feature 2 (Standard) */}
              <GlowCard delay={0.2} className="flex flex-col justify-between group/ai border-green-500/20">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(34,197,94,0.5)] group-hover/ai:scale-110 transition-transform">
                    <Bot className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">AI Travel Agent</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed text-balance">Your personal 24/7 travel assistant powered by Groq. Ask questions and get instant itineraries in chat.</p>
                </div>
              </GlowCard>

              {/* Feature 3 (Standard) */}
              <GlowCard delay={0.3} className="flex flex-col justify-between group/exp border-emerald-500/20">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] group-hover/exp:scale-110 transition-transform">
                    <Receipt className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Smart Expenses</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed text-balance">Keep track of who paid what. Finalize expenses and automatically email settlement summaries.</p>
                </div>
              </GlowCard>

              {/* Feature 4 (Standard) */}
              <GlowCard delay={0.4} className="flex flex-col justify-between group/sync border-cyan-500/20">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)] group-hover/sync:rotate-180 transition-transform duration-700">
                    <RefreshCw className="w-6 h-6 text-cyan-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Real-Time Sync</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed text-balance">Powered by WebSockets. Every action, chat, and location update pushes instantly.</p>
                </div>
              </GlowCard>

              {/* Feature 5 (Large Span) */}
              <GlowCard className="md:col-span-2 md:row-span-2 flex flex-col justify-between group/audio border-orange-500/20 bg-gradient-to-br from-card/30 via-orange-500/5 to-orange-500/10" delay={0.5}>
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(249,115,22,0.5)] transition-colors group-hover/audio:bg-orange-500 group-hover/audio:text-white text-orange-500">
                    <Mic className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 tracking-tight">Live Audio Rooms</h3>
                  <p className="text-muted-foreground font-medium max-w-md text-balance leading-relaxed text-lg">Hop into live, crystal-clear voice chat with your trip members anytime. Integrated directly into the platform using powerful LiveKit webRTC technology.</p>
                </div>
                {/* Decorative audio waves */}
                <div className="absolute bottom-0 right-0 p-8 flex items-end gap-2 opacity-30 group-hover/audio:opacity-60 transition-opacity">
                  {[4, 8, 5, 10, 6, 3].map((h, i) => (
                    <motion.div key={i} animate={{ height: [h*4, h*8, h*4] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.1 }} className="w-3 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-full shadow-lg" />
                  ))}
                </div>
              </GlowCard>

              {/* Feature 6 */}
              <GlowCard delay={0.6} className="flex flex-col justify-between group/ins border-purple-500/20">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)] group-hover/ins:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">AI Insights</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed text-balance">Click any checkpoint to instantly generate context summaries and visiting tips.</p>
                </div>
              </GlowCard>

              {/* Feature 7 */}
              <GlowCard delay={0.7} className="flex flex-col justify-between group/notes border-yellow-500/20">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(234,179,8,0.5)] group-hover/notes:scale-110 transition-transform">
                    <StickyNote className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Sticky Notes</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed text-balance">Share ideas, reminders, and web links instantly with color-coded notes.</p>
                </div>
              </GlowCard>

              {/* Feature 8 */}
              <GlowCard delay={0.8} className="md:col-span-2 flex flex-col justify-between group/chat border-indigo-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)] group-hover/chat:scale-110 transition-transform">
                      <MessageCircle className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 tracking-tight">Group Chat & SOS Alerts</h3>
                    <p className="text-muted-foreground font-medium max-w-md text-balance leading-relaxed">A dedicated real-time chat room. Lost in a new city? Instantly alert your group by changing your status to "Need help". Global notifications immediately fire to everyone.</p>
                  </div>
                  <div className="hidden md:flex h-14 w-14 rounded-full border-2 border-red-500/50 bg-red-500/20 items-center justify-center text-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </GlowCard>

            </div>
          </div>
        </section>

        {/* STORY / TECH STACK SECTION */}
        <section className="w-full py-32 bg-muted/20 border-t border-border">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-start">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance leading-tight">Built to end group travel chaos.</h2>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>
                    Endless group chats, scattered spreadsheets, lost friends in foreign cities, and the inevitable headache of splitting the bill.
                  </p>
                  <p>
                    <strong>Realtime TripPlanner</strong> was engineered to solve all of this. We combined cutting-edge web technologies to create a single, unified workspace where every trip member is perfectly in sync. 
                  </p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full"
              >
                 <div className="bg-card/80 border border-border/50 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
                    <h3 className="relative z-10 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Modern Architecture</h3>
                    <ul className="relative z-10 space-y-3">
                      {[
                        { text: "React & Vite Frontend", color: "bg-blue-500" },
                        { text: "Node.js & Express Backend", color: "bg-green-500" },
                        { text: "WebSocket Sync Engine", color: "bg-purple-500" },
                        { text: "LiveKit Audio Rooms", color: "bg-orange-500" },
                        { text: "Groq AI Integrations", color: "bg-pink-500" },
                      ].map((tech, i) => (
                        <li key={i} className="flex items-center gap-3 text-foreground font-semibold py-2 border-b border-border/30 last:border-0 hover:translate-x-2 transition-transform">
                           <div className={`w-2.5 h-2.5 rounded-full ${tech.color} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} />
                           {tech.text}
                        </li>
                      ))}
                    </ul>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-32 bg-background flex items-center justify-center border-t border-border">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="container px-4 text-center space-y-10"
           >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-balance">Ready to travel smarter?</h2>
              <div className="flex justify-center">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="group relative inline-flex h-14 items-center justify-center rounded-full bg-foreground px-10 text-base font-semibold text-background shadow-xl transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer">
                      Create Your First Trip
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link to="/home" className="group relative inline-flex h-14 items-center justify-center rounded-full bg-foreground px-10 text-base font-semibold text-background shadow-xl transition-transform hover:scale-[1.02] active:scale-95">
                    Go to Dashboard
                  </Link>
                </SignedIn>
              </div>
           </motion.div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-border bg-card/30">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            © 2026 Realtime TripPlanner.
          </p>
          <nav className="flex gap-6">
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" to="#">About</Link>
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" to="#">Privacy</Link>
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" to="#">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
