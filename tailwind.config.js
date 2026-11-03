/* Дзеркало конфігурації для автодоповнення Tailwind CSS IntelliSense у VS Code.
   Браузер бере конфіг з <script> у <head> кожної сторінки; тут він лише для підказок. */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E3F20', hover: '#2A5A2D' },
        secondary: { DEFAULT: '#4A6B4F', hover: '#3B5A40' },
        accent: { DEFAULT: '#C86432', hover: '#A94F24', tint: '#FBEDE6' },
        neutral: { dark: '#182218' },
        background: '#F4F6F4',
        tint: '#E6EDE6',
        line: '#D4DAD4',
      },
      fontFamily: {
        main: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['Newsreader', 'serif'],
      },
      fontSize: {
        '2xs': ['0.75rem', '1.5'],
        xs: ['0.8125rem', '1.6'],
        sm: ['0.875rem', '1.6'],
        label: ['0.9375rem', '1.6'],
        base: ['1rem', '1.6'],
        lg: ['1.125rem', '1.5'],
        title: ['1.375rem', '1.3'],
        h2: ['clamp(1.5rem, 1rem + 2vw, 2rem)', '1.2'],
        page: ['clamp(1.75rem, 4vw, 2.5rem)', '1.15'],
        hero: ['clamp(1.75rem, 4vw, 2.75rem)', '1.1'],
        confirm: ['clamp(1.75rem, 4vw, 2.25rem)', '1.2'],
      },
      spacing: { 18: '4.5rem', 45: '11.25rem' },
      height: { 'card-img': '170px' },
      maxWidth: { container: '1200px', narrow: '1000px', text: '600px', hero: '1000px', cta: '640px', figure: '420px' },
      boxShadow: {
        header: '0 2px 8px rgba(0,0,0,0.08)',
        soft: '0 2px 8px rgba(0,0,0,0.12)',
        card: '3px 4px 10px rgba(0,0,0,0.35)',
        'card-hover': '4px 8px 16px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        hero: "linear-gradient(90deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%), url('assets/images/hero-bg.jpg')",
      },
      gridTemplateColumns: {
        header: '1fr auto 1fr',
        footer: '1.4fr 1fr 1fr',
        catalog: '220px 1fr',
        detail: 'minmax(0, 1fr) 320px',
        story: '1.4fr 1fr',
        gallery: '2fr 1fr',
      },
    },
  },
};