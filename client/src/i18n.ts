const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.browse': 'Browse Services', 'nav.offer': 'Offer Service', 'nav.help': 'Help Needed',
    'nav.communities': 'Communities', 'nav.dashboard': 'My Dashboard',
    'hero.title1': 'What You Give,', 'hero.title2': 'Comes Back',
    'hero.subtitle': 'Share your talents with your community and earn points. Use those points to get help when you need it. No money involved — just people helping people.',
    'hero.quote': '— Shota Rustaveli',
    'hero.getStarted': 'Get Started Free', 'hero.browse': 'Browse Services',
    'hero.freePoints': '🪃 New members start with 50 free points',
    'how.title': 'How Boomerang Works', 'how.subtitle': 'Three simple steps to start exchanging',
    'cta.title': 'Ready to join the community?',
    'cta.subtitle': 'Start with 50 free points. Offer your skills, help your neighbors, and get help when you need it.',
    'cta.button': 'Create Free Account',
    'login.title': 'Welcome back', 'login.subtitle': 'Log in to your Boomerang account',
    'register.title': 'Join Boomerang',
    'footer.tagline': 'What you give, comes back. Share your skills, earn points, get help — no money needed.',
  },
  es: {
    'nav.browse': 'Buscar Servicios', 'nav.offer': 'Ofrecer Servicio', 'nav.help': 'Ayuda Necesaria',
    'nav.communities': 'Comunidades', 'nav.dashboard': 'Mi Panel',
    'hero.title1': 'Lo Que Das,', 'hero.title2': 'Vuelve',
    'hero.subtitle': 'Comparte tus talentos con tu comunidad y gana puntos. Usa esos puntos para obtener ayuda cuando la necesites. Sin dinero — solo personas ayudando personas.',
    'hero.quote': '— Shota Rustaveli',
    'hero.getStarted': 'Empieza Gratis', 'hero.browse': 'Buscar Servicios',
    'hero.freePoints': '🪃 Los nuevos miembros empiezan con 50 puntos gratis',
    'how.title': 'Cómo Funciona Boomerang', 'how.subtitle': 'Tres pasos simples para empezar',
    'cta.title': '¿Listo para unirte a la comunidad?',
    'cta.subtitle': 'Empieza con 50 puntos gratis. Ofrece tus habilidades, ayuda a tus vecinos y obtén ayuda cuando la necesites.',
    'cta.button': 'Crear Cuenta Gratis',
    'login.title': 'Bienvenido de nuevo', 'login.subtitle': 'Inicia sesión en tu cuenta',
    'register.title': 'Únete a Boomerang',
    'footer.tagline': 'Lo que das, vuelve. Comparte tus habilidades, gana puntos, obtén ayuda — sin dinero.',
  },
  fr: {
    'nav.browse': 'Parcourir', 'nav.offer': 'Offrir un Service', 'nav.help': 'Aide Recherchée',
    'nav.communities': 'Communautés', 'nav.dashboard': 'Mon Tableau de Bord',
    'hero.title1': 'Ce Que Tu Donnes,', 'hero.title2': 'Te Revient',
    'hero.subtitle': 'Partagez vos talents avec votre communauté et gagnez des points. Utilisez ces points pour obtenir de l\'aide. Pas d\'argent — juste des gens qui s\'entraident.',
    'hero.quote': '— Shota Rustaveli',
    'hero.getStarted': 'Commencer Gratuitement', 'hero.browse': 'Parcourir les Services',
    'hero.freePoints': '🪃 Les nouveaux membres commencent avec 50 points gratuits',
    'how.title': 'Comment Fonctionne Boomerang', 'how.subtitle': 'Trois étapes simples',
    'cta.title': 'Prêt à rejoindre la communauté?',
    'cta.subtitle': 'Commencez avec 50 points gratuits. Offrez vos compétences et obtenez de l\'aide.',
    'cta.button': 'Créer un Compte Gratuit',
    'login.title': 'Bon retour', 'login.subtitle': 'Connectez-vous à votre compte',
    'register.title': 'Rejoignez Boomerang',
    'footer.tagline': 'Ce que tu donnes te revient. Partagez, gagnez des points, obtenez de l\'aide.',
  },
};

let currentLang = localStorage.getItem('lang') || 'en';

export function t(key: string): string {
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

export function setLang(lang: string) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  window.location.reload();
}

export function getLang(): string { return currentLang; }
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];
