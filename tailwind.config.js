/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 深松绿：知性、沉稳、教育感。避免 AI 蓝/紫渐变指纹。
        brand: {
          50: '#f1f7f3',
          100: '#ddece3',
          200: '#bcd8c8',
          300: '#92bca6',
          400: '#669c81',
          500: '#438065',
          600: '#2f6b52',
          700: '#275744',
          800: '#214638',
          900: '#1c3a2f',
          950: '#0e211a',
        },
        // 暖纸色背景，替代冷灰 slate
        canvas: '#f7f5f1',
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        // 带暖色调的阴影，避免纯黑投影
        card: '0 1px 2px 0 rgb(28 25 23 / 0.04), 0 4px 16px -4px rgb(28 25 23 / 0.08)',
        lift: '0 8px 30px -6px rgb(28 25 23 / 0.12)',
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
    },
  },
  plugins: [],
}
