import { Button } from "./ui/button";
import { Menu, X, Search, User, Bell, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "../contexts/LanguageContext";
import kemenkesLogo from "figma:asset/23d6a0423e1abe1da616df4d33a7eaab202bc5d3.png";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: "#home", label: t('header.home') },
    { href: "#profil", label: t('header.profile') },
    { href: "#informasi", label: t('header.publicInfo') },
    { href: "#services", label: t('header.services') },
    { href: "#media", label: t('header.media') },
    { href: "#tautan", label: t('header.links') },
    { href: "#contact", label: t('header.contact') }
  ];

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Top Emergency Bar */}
      <div className="bg-kemenkes-teal text-white py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Hotline: 119 | 1500-567</span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>kontak@kemkes.go.id</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <motion.header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/98 backdrop-blur-md shadow-lg border-b border-gray-200/30' 
            : 'bg-white/95 backdrop-blur-sm shadow-md'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Tagline */}
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ rotate: 3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <img 
                    src={kemenkesLogo} 
                    alt="Kementerian Kesehatan RI" 
                    className="max-w-full max-h-full object-contain object-center"
                  />
                </div>
              </motion.div>
              <div className="hidden lg:block">
                <div className="text-xl font-bold text-gray-900">
                  {t('header.ministry')}
                </div>
                <div className="text-sm text-kemenkes-teal font-medium">
                  {t('header.republic')}
                </div>
              </div>
              <div className="hidden xl:block ml-8">
                <div className="text-2xl font-bold bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime bg-clip-text text-transparent">
                  {t('header.tagline')}
                </div>
              </div>
            </motion.div>

            {/* Search & Profile Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('header.search')}
                  className="w-64 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-kemenkes-teal focus:border-transparent transition-all duration-300"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-kemenkes-teal hover:bg-kemenkes-teal/10">
                  <Bell className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-kemenkes-teal hover:bg-kemenkes-teal/10">
                  <User className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime hover:from-kemenkes-dark-teal hover:to-kemenkes-dark-lime text-white px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  SIKM
                </Button>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-kemenkes-teal hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <nav className="hidden lg:flex items-center justify-center space-x-8 py-3">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="relative text-gray-700 hover:text-kemenkes-teal transition-colors duration-200 py-2 px-4 group font-medium text-sm tracking-wide"
                  whileHover={{ y: -1 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {item.label}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="lg:hidden border-t border-gray-200/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white/98 backdrop-blur-md">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-kemenkes-teal hover:bg-kemenkes-teal/10 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
                <motion.div 
                  className="pt-2 border-t border-gray-200/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="px-3 py-2">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder={t('header.search')}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-kemenkes-teal focus:border-transparent"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime hover:from-kemenkes-dark-teal hover:to-kemenkes-dark-lime text-white rounded-full shadow-lg">
                      {t('header.sikmPortal')}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}