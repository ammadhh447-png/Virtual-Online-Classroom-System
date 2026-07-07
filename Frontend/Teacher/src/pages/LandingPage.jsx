import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Mic, ClipboardList, GraduationCap, UserPlus, Video, BrainCircuit, Send, Phone as PhoneIcon, MapPin, Twitter, Linkedin, Github, Menu, X } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMenuOpen]);

  const features = [
    {
      icon: <UserCheck className="w-12 h-12 text-brand-cyan mx-auto" />,
      title: "Attendance Tracking",
      description: "Auto-mark attendance with AI. View your daily and weekly attendance records."
    },
    {
      icon: <Mic className="w-12 h-12 text-brand-cyan mx-auto" />,
      title: "Access Recordings",
      description: "Never miss a class. Rewatch lectures whenever you want."
    },
    {
      icon: <ClipboardList className="w-12 h-12 text-brand-cyan mx-auto" />,
      title: "Assignment & Quiz",
      description: "Give tasks and check results online."
    }
  ];

  const howItWorksSteps = [
    {
      icon: <UserPlus className="w-12 h-12 text-brand-cyan" />,
      title: "1. Create Account",
      description: "Sign up for free and set up your student profile in minutes."
    },
    {
      icon: <Video className="w-12 h-12 text-brand-cyan" />,
      title: "2. Join a Class",
      description: "Easily join your live virtual classroom with a single click from your dashboard."
    },
    {
      icon: <BrainCircuit className="w-12 h-12 text-brand-cyan" />,
      title: "3. Interact & Learn",
      description: "Engage with tutors, classmates, and our powerful AI assistant for a rich learning experience."
    }
  ];

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Static Gradient Ring Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10rem] -right-[15rem] w-[30rem] h-[30rem] md:-top-[20rem] md:-right-[25rem] md:w-[50rem] md:h-[50rem] border-[40px] md:border-[60px] border-cyan-400/10 rounded-full" />
        <div className="absolute -top-[10rem] -right-[15rem] w-[30rem] h-[30rem] md:-top-[20rem] md:-right-[25rem] md:w-[50rem] md:h-[50rem] border-[40px] md:border-[60px] border-cyan-400/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-[10rem] -left-[15rem] w-[30rem] h-[30rem] md:-bottom-[20rem] md:-left-[20rem] md:w-[45rem] md:h-[45rem] border-[40px] md:border-[60px] border-cyan-400/10 rounded-full" />
        <div className="absolute -bottom-[10rem] -left-[15rem] w-[30rem] h-[30rem] md:-bottom-[20rem] md:-left-[20rem] md:w-[45rem] md:h-[45rem] border-[40px] md:border-[60px] border-cyan-400/10 rounded-full filter blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-brand-cyan" />
              <span className="text-2xl font-bold">Virtual CUI</span>
            </div>
            <div className="hidden lg:flex items-center space-x-2 text-lg">
              {navLinks.map(link => (
                <a key={link.name} href={link.href} className="px-4 py-2 rounded-full hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-300 transition-colors">{link.name}</a>
              ))}
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <button onClick={() => navigate('/login')} className="text-lg font-medium bg-transparent border border-brand-cyan text-brand-cyan px-6 py-2 rounded-full hover:bg-brand-cyan hover:text-black transition-all">Login</button>
              <button onClick={() => navigate('/signup')} className="text-lg font-medium bg-brand-cyan text-black px-6 py-2 rounded-full hover:bg-cyan-300 transition-all">Sign Up</button>
            </div>
            <div className="lg:hidden">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 text-gray-300 hover:text-white">
                <Menu className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black z-50 p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-brand-cyan" />
                <span className="text-2xl font-bold">Virtual CUI</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-300 hover:text-white">
                <X className="w-8 h-8" />
              </button>
            </div>
            <nav className="flex flex-col items-center justify-center flex-1 space-y-8 text-2xl">
              {navLinks.map(link => (
                <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-cyan-300 transition-colors">{link.name}</a>
              ))}
            </nav>
            <div className="flex flex-col space-y-4 mt-12">
              <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="text-lg font-medium bg-transparent border border-brand-cyan text-brand-cyan px-6 py-3 rounded-full hover:bg-brand-cyan hover:text-black transition-all">Login</button>
              <button onClick={() => { navigate('/signup'); setIsMenuOpen(false); }} className="text-lg font-medium bg-brand-cyan text-black px-6 py-3 rounded-full hover:bg-cyan-300 transition-all">Sign Up</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              AI Virtual Classroom
              <br />
              Learn Smarter, Teach Better
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">Interactive classes, instant AI notes, and seamless learning - all in one place.</p>
            <button onClick={() => navigate('/signup')} className="text-xl sm:text-2xl font-bold bg-transparent border-2 border-brand-cyan text-brand-cyan px-8 sm:px-12 py-3 sm:py-4 rounded-full hover:bg-brand-cyan hover:text-black transition-all transform hover:scale-105">Start now</button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Powerful Features for Modern Learning</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-brand-cyan/30 shadow-lg shadow-brand-cyan/10 transition-all hover:border-brand-cyan/60 hover:shadow-brand-cyan/20 hover:-translate-y-2"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-black relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Get Started in 3 Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <div className="p-6 bg-gray-800/50 border-2 border-brand-cyan/50 rounded-full mb-6">{step.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 max-w-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Virtual CUI</h2>
            <p className="text-gray-300 text-lg mb-4 leading-relaxed">Virtual CUI was born from a simple idea: education should be accessible, engaging, and effective for everyone, everywhere. We are a team of passionate educators, developers, and innovators dedicated to breaking down the barriers of traditional learning.</p>
            <p className="text-gray-300 text-lg leading-relaxed">Our platform leverages cutting-edge AI to create a personalized and interactive virtual classroom experience. We believe in empowering both students and teachers with the tools they need to succeed in a digital-first world.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="w-full h-64 md:h-80 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 flex items-center justify-center p-8"
          >
            <BrainCircuit className="w-24 h-24 md:w-32 md:h-32 text-brand-cyan opacity-50" />
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 px-4 bg-black relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Get In Touch</h2>
            <p className="text-gray-400 mt-4">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-brand-cyan/30 rounded-2xl p-8 md:p-12">
            <form>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <input type="text" placeholder="Your Name" className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-brand-cyan" />
                <input type="email" placeholder="Your Email" className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-brand-cyan" />
              </div>
              <textarea placeholder="Your Message" rows="6" className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg mb-6 focus:outline-none focus:border-brand-cyan"></textarea>
              <button type="submit" className="w-full text-lg font-bold bg-brand-cyan text-black px-12 py-3 rounded-full hover:bg-cyan-300 transition-all">
                <Send className="inline-block w-5 h-5 mr-2" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900/50 border-t border-brand-cyan/20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-8 h-8 text-brand-cyan" />
                <span className="text-2xl font-bold">Virtual CUI</span>
              </div>
              <p className="text-gray-400">The future of learning, powered by AI.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-brand-cyan">Home</a></li>
                <li><a href="#features" className="hover:text-brand-cyan">Features</a></li>
                <li><a href="#about" className="hover:text-brand-cyan">About Us</a></li>
                <li><a href="#contact" className="hover:text-brand-cyan">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center justify-center md:justify-start"><Send className="w-4 h-4 mr-3 text-brand-cyan" /> support@Virtual CUI.com</li>
                <li className="flex items-center justify-center md:justify-start"><PhoneIcon className="w-4 h-4 mr-3 text-brand-cyan" /> +1 (555) 123-4567</li>
                <li className="flex items-center justify-center md:justify-start"><MapPin className="w-4 h-4 mr-3 text-brand-cyan" /> FutureTech City, Earth</li>
              </ul>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-bold text-lg mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-brand-cyan"><Twitter /></a>
                <a href="#" className="text-gray-400 hover:text-brand-cyan"><Linkedin /></a>
                <a href="#" className="text-gray-400 hover:text-brand-cyan"><Github /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-500">
            <p>© 2025 Virtual CUI. All rights reserved. The future of learning is here.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
