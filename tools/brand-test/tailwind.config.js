// token file: tailwind keys for the palette, radius and shadow checks
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        brand: { DEFAULT: '#0066ff', 500: '#0066ff' },
        sky: { 500: '#1da1f2' },
      },
      borderRadius: { card: '8px', lg: '8px' },
      boxShadow: { card: '0 1px 2px rgba(0, 0, 0, 0.08)' },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
};
