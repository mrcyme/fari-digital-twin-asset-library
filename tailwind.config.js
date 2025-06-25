/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            // si tu veux, tu peux y étendre tes couleurs – mais rien d’obligatoire
        },
    },
    plugins: [],
    darkMode: 'class',
};
