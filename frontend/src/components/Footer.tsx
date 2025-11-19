import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  ExternalLink,
  Globe,
  Shield,
  Users,
  Award
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";
import kemenkesLogo from "figma:asset/23d6a0423e1abe1da616df4d33a7eaab202bc5d3.png";

export function Footer() {
  const quickLinks = [
    { title: "Profil Kemenkes", href: "#", icon: Users },
    { title: "Visi & Misi", href: "#", icon: Award },
    { title: "Struktur Organisasi", href: "#", icon: Globe },
    { title: "Pejabat Eselon I", href: "#", icon: Shield },
    { title: "Hubungi Kami", href: "#", icon: Phone }
  ];

  const services = [
    { title: "Platform SatuSehat", href: "#", popular: true },
    { title: "Sertifikat Vaksin", href: "#", popular: false },
    { title: "BPJS Kesehatan", href: "#", popular: true },
    { title: "Imunisasi Online", href: "#", popular: false },
    { title: "Telemedicine", href: "#", popular: true }
  ];

  const programs = [
    { title: "Indonesia Sehat", href: "#", status: "ongoing" },
    { title: "GERMAS", href: "#", status: "ongoing" },
    { title: "Stunting Prevention", href: "#", status: "priority" },
    { title: "Program P2PTM", href: "#", status: "ongoing" },
    { title: "Kesehatan Mental", href: "#", status: "new" }
  ];

  const digitalPlatforms = [
    { name: "SIKM", desc: "Sistem Informasi Kesehatan Masyarakat", users: "2.1M+" },
    { name: "E-Puskesmas", desc: "Manajemen Puskesmas Digital", users: "11.8K+" },
    { name: "PeduliLindungi", desc: "Contact Tracing & Health Status", users: "234M+" }
  ];

  const legalLinks = [
    { title: "Kebijakan Privasi", href: "#" },
    { title: "Syarat & Ketentuan", href: "#" },
    { title: "Disclaimer", href: "#" },
    { title: "Sitemap", href: "#" },
    { title: "Accessibility", href: "#" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-traditional opacity-30" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div 
          className="grid lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* About Section */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <div className="flex items-center mb-6">
              <motion.div
                className="w-14 h-14 flex items-center justify-center mr-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img 
                  src={kemenkesLogo} 
                  alt="Logo Kemenkes" 
                  className="max-w-full max-h-full object-contain"
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold">Kementerian Kesehatan</h3>
                <p className="text-kemenkes-lime font-medium">Republik Indonesia</p>
                <Badge className="mt-1 bg-kemenkes-teal/20 text-kemenkes-teal">
                  Kemenkes Hebat, Indonesia Sehat
                </Badge>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Membangun Indonesia yang sehat, mandiri, dan berkeadilan melalui 
              pelayanan kesehatan berkualitas untuk seluruh rakyat Indonesia.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <motion.div 
                className="flex items-start group cursor-pointer" 
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MapPin className="h-5 w-5 text-kemenkes-teal mr-3 mt-1 flex-shrink-0 group-hover:text-kemenkes-lime transition-colors" />
                <div>
                  <p className="text-sm font-medium">Jl. H.R. Rasuna Said Blok X5 Kav. 4-9</p>
                  <p className="text-sm text-gray-400">Kuningan, Jakarta Selatan 12950</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center group cursor-pointer" 
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Phone className="h-5 w-5 text-kemenkes-teal mr-3 group-hover:text-kemenkes-lime transition-colors" />
                <div>
                  <p className="text-sm font-medium">(021) 5201590</p>
                  <p className="text-xs text-gray-400">Senin - Jumat, 08:00 - 16:00 WIB</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center group cursor-pointer" 
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="h-5 w-5 text-kemenkes-teal mr-3 group-hover:text-kemenkes-lime transition-colors" />
                <div>
                  <p className="text-sm font-medium">kontak@kemkes.go.id</p>
                  <p className="text-xs text-gray-400">Respon 1x24 jam</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-xl font-bold mb-6 text-kemenkes-lime">Tentang Kami</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li 
                  key={index} 
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <a 
                    href={link.href} 
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <link.icon className="h-4 w-4 mr-2 text-kemenkes-teal group-hover:text-kemenkes-lime transition-colors" />
                    {link.title}
                    <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h4 className="text-xl font-bold mb-6 text-kemenkes-lime">Layanan Unggulan</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <motion.li 
                  key={index} 
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <a 
                    href={service.href} 
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-between group"
                  >
                    <span className="flex items-center">
                      {service.title}
                      {service.popular && (
                        <Badge className="ml-2 bg-kemenkes-teal/20 text-kemenkes-teal text-xs">
                          Populer
                        </Badge>
                      )}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Programs */}
          <motion.div variants={itemVariants}>
            <h4 className="text-xl font-bold mb-6 text-kemenkes-lime">Program Prioritas</h4>
            <ul className="space-y-3">
              {programs.map((program, index) => (
                <motion.li 
                  key={index} 
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <a 
                    href={program.href} 
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-between group"
                  >
                    <span className="flex items-center">
                      {program.title}
                      <Badge className={`ml-2 text-xs ${
                        program.status === 'priority' ? 'bg-red-500/20 text-red-400' :
                        program.status === 'new' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {program.status === 'priority' ? 'Prioritas' :
                         program.status === 'new' ? 'Baru' : 'Aktif'}
                      </Badge>
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Digital Platforms Showcase */}
        <motion.div 
          className="mt-16 pt-8 border-t border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-2xl font-bold mb-8 text-center">Platform Digital Kemenkes</h4>
          <div className="grid md:grid-cols-3 gap-6">
            {digitalPlatforms.map((platform, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-kemenkes-teal/10 to-kemenkes-lime/10 border-kemenkes-teal/20 hover:border-kemenkes-lime/40 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-kemenkes-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-6 w-6 text-kemenkes-teal" />
                    </div>
                    <h5 className="font-bold text-lg text-white mb-2">{platform.name}</h5>
                    <p className="text-sm text-gray-300 mb-3">{platform.desc}</p>
                    <Badge className="bg-kemenkes-lime/20 text-kemenkes-lime">
                      {platform.users} pengguna
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Emergency Numbers */}
        <motion.div 
          className="mt-16 pt-8 border-t border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-2xl font-bold mb-8 text-center text-red-400">Kontak Darurat</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              className="text-center p-6 bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-lg border border-red-500/20 hover:border-red-400/40 transition-all duration-300 group"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Phone className="h-10 w-10 text-red-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-red-400 mb-2">Darurat Kesehatan</h4>
              <p className="text-3xl font-bold text-white mb-2">119</p>
              <p className="text-sm text-gray-300">24 Jam • Gratis</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6 bg-gradient-to-br from-kemenkes-teal/30 to-kemenkes-dark-teal/30 rounded-lg border border-kemenkes-teal/20 hover:border-kemenkes-teal/40 transition-all duration-300 group"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Phone className="h-10 w-10 text-kemenkes-light-teal mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-kemenkes-light-teal mb-2">Halo Kemkes</h4>
              <p className="text-3xl font-bold text-white mb-2">1500-567</p>
              <p className="text-sm text-gray-300">Senin-Jumat • 08:00-16:00</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6 bg-gradient-to-br from-kemenkes-lime/30 to-kemenkes-dark-lime/30 rounded-lg border border-kemenkes-lime/20 hover:border-kemenkes-lime/40 transition-all duration-300 group"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Mail className="h-10 w-10 text-kemenkes-light-lime mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-kemenkes-light-lime mb-2">Pengaduan</h4>
              <p className="text-lg font-bold text-white mb-2">pengaduan@kemkes.go.id</p>
              <p className="text-sm text-gray-300">Respon 1x24 jam</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Social Media & Bottom */}
        <motion.div 
          className="mt-16 pt-8 border-t border-gray-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-6">
              <p className="text-gray-400 font-medium">Ikuti Kami:</p>
              <div className="flex space-x-3">
                <motion.div whileHover={{ scale: 1.2, y: -2 }}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-blue-600/20 p-3 rounded-full">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, y: -2 }}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-sky-500/20 p-3 rounded-full">
                    <Twitter className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, y: -2 }}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-pink-500/20 p-3 rounded-full">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, y: -2 }}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-red-500/20 p-3 rounded-full">
                    <Youtube className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              {legalLinks.map((link, index) => (
                <motion.a 
                  key={index}
                  href={link.href} 
                  className="text-gray-400 hover:text-kemenkes-teal transition-colors"
                  whileHover={{ y: -2 }}
                >
                  {link.title}
                </motion.a>
              ))}
            </div>
          </div>
          
          <motion.div 
            className="mt-8 pt-8 border-t border-gray-700 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-gray-400 text-lg font-medium mb-2">
              &copy; 2025 Kementerian Kesehatan Republik Indonesia
            </p>
            <p className="text-gray-500 text-sm">
              Website ini dikelola oleh <span className="text-kemenkes-lime font-medium">Pusat Data dan Informasi</span> Kementerian Kesehatan RI
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Terakhir diperbarui: 19 Juni 2025 • Versi 2.1.0
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}