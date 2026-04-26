const ADJECTIVES = ['Swift', 'Dark', 'Epic', 'Neon', 'Cyber', 'Shadow', 'Iron', 'Storm', 'Void', 'Ghost', 'Hyper', 'Turbo'];
const NOUNS      = ['Gamer', 'Hunter', 'Warrior', 'Knight', 'Ranger', 'Blade', 'Wolf', 'Eagle', 'Fox', 'Viper', 'Titan'];

/** Genera un username aleatorio tipo "NeonWolf#4823" */
const generateUsername = () => {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}#${num}`;
};

module.exports = { generateUsername };
