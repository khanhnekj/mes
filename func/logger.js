const chalk = require('chalk');
const gradient = require('gradient-string');
const con = require('./config/config.main.json');
const theme = con.DESIGN.Theme;

class Logger {
  constructor() {
    this.co = this.setTheme(theme);
    this.error = chalk.red.bold;
  }

  setTheme(theme) {
    theme = theme.toLowerCase();
    switch (theme) {
      case 'blue':
        return gradient([{ color: "#1affa3", pos: 0.2 }, { color: "cyan", pos: 0.4 }, { color: "pink", pos: 0.6 }, { color: "cyan", pos: 0.8 }, { color: '#1affa3', pos: 1 }]);
      case 'dream2':
        this.cra = gradient("blue", "pink");
        return gradient("#a200ff", "#21b5ff", "#a200ff");
      case 'dream':
        return gradient([{ color: "blue", pos: 0.2 }, { color: "pink", pos: 0.3 }, { color: "gold", pos: 0.6 }, { color: "pink", pos: 0.8 }, { color: "blue", pos: 1 }]);
      case 'test':
        return gradient("#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4");
      case 'fiery':
        return gradient("#fc2803", "#fc6f03", "#fcba03");
      case 'rainbow':
        return gradient.rainbow;
      case 'pastel':
        return gradient.pastel;
      case 'cristal':
        return gradient.cristal;
      case 'red':
        return gradient("red", "orange");
      case 'aqua':
        this.error = chalk.blueBright;
        return gradient("#0030ff", "#4e6cf2");
      case 'pink':
        this.cra = gradient('purple', 'pink');
        return gradient("#d94fff", "purple");
      case 'retro':
        this.cra = gradient("#d94fff", "purple");
        return gradient.retro;
      case 'sunlight':
        this.cra = gradient("#f5bd31", "#f5e131");
        return gradient("orange", "#ffff00", "#ffe600");
      case 'teen':
        this.cra = gradient("#00a9c7", "#853858", "#853858", "#00a9c7");
        return gradient.teen;
      case 'summer':
        this.cra = gradient("#fcff4d", "#4de1ff");
        return gradient.summer;
      case 'flower':
        this.cra = gradient("blue", "purple", "yellow", "#81ff6e");
        return gradient.pastel;
      case 'ghost':
        this.cra = gradient("#0a658a", "#0a7f8a", "#0db5aa");
        return gradient.mind;
      case 'hacker':
        this.cra = chalk.hex('#4be813');
        return gradient('#47a127', '#0eed19', '#27f231');
      default:
        return gradient("#243aff", "#4687f0", "#5800d4");
    }
  }

  log(data, option) {
    let coloredData = '';
    switch (option) {
      case 'warn':
        coloredData = gradient('#3aed34', '#c2ed34').multiline('[ WARN ] - ' + data);
        console.log(chalk.bold(coloredData));
        break;
      case 'error':
        coloredData = chalk.bold.hex('#FF0000')('[ ERROR ] - ') + chalk.bold.red(data);
        console.log(coloredData);
        break;
      default:
        coloredData = this.co(`${option} - ` + data);
        console.log(chalk.bold(coloredData));
        break;
    }
  }

  loader(data, option) {
    let coloredData = '';
    switch (option) {
      case 'warn':
        coloredData = this.co('[===== MIRAI-DONGDEV =====] - ' + data);
        console.log(chalk.bold(coloredData));
        break;
      case 'error':
        coloredData = this.co('[ MIRAI-DONGDEV ] - ') + data;
        console.log(chalk.bold(coloredData));
        break;
      default:
        coloredData = this.co('[ MIRAI-DONGDEV ] - ' + data);
        console.log(chalk.bold(coloredData));
        break;
    }
  }
}

module.exports = new Logger();