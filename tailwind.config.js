export default {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx,vue}',
    ],
    theme: {
      extend: {
      },
    },
    plugins: [
      require('tailwind-scrollbar'),
    ],
    safelist: [
      'grid-cols-3',
      'grid-cols-4',
      'grid-cols-5',
      'grid-cols-6',
      'grid-cols-7',
      'grid-cols-8',
      'grid-cols-9',
      'animate-float-up',
    ]
}
  