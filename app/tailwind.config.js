/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        Lexend: ['Lexend', 'sans-serif'],
        Orbitron: ['Orbitron', 'sans-serif'],
        Oxanium: ['Oxanium', 'sans-serif'],
        Marvel: ['Marvel', 'sans-serif']
      },
      colors: {
        lightGray:'#C1C1C1',
        darkGray: '#838B92',
        dark: '#181823',
        lightDark: '#1F202E',
        lightBg: '#F4F7F9',
        sea: '#58F6F7',
        darkGreen: '#2B7E21',
        yellow:'#FDFAE5',
        yellowButton:'#E2BF00',
        green:'#AFED64',
        greenHover:'#215B1A',
        yellowHover:'#B69C0F',
        grayBorder:'#D4D6D3',
        grayInput:'#F4F7F9',
        lightStone:'#A6A6A6',
        darkStone:'#1F1D19',
        lightestWood:"#D6C99E",
        button:"#FFA10A",
        buttonHover:"#E09113",
        blue:"#0ABFFF",
        darkCard:'#252525',
        darkCardHover:'#2B2B2B',
        arenaLight:'#FFC66A',
        arenaMedium:'#272624',
        arenaDark:'#1F1D19',
        arenaBg:'#261B0A'
      },
      backgroundImage: {
        'linearOrange': 'linear-gradient(to bottom,rgb(132, 81, 0),rgb(23, 19, 1))',
        'linear': 'linear-gradient(to bottom,rgb(230, 240, 255),rgb(204, 201, 222))',
        'linearRed': 'linear-gradient(to right, #F61616, #900D0D)',

      }
    },
  },
  plugins: [],
}

