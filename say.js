const say = require('say');
module.exports = (text) => {
  if (text) say.speak(text);
};