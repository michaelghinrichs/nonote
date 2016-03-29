import { install } from 'source-map-support';
install();

import 'babel-polyfill';
/* eslint-disable */
// Libs
console.log('sup');
var chalk = require('chalk');
var program = require('commander');
var fs = require('fs-extra');
var moment = require('moment');
var co = require('co');
var prompt = require('co-prompt');

var templateJSON = require('../templates/default.json');
// TODO: think about changing these status functions to a single type
// signiture -> changeStatus(index, key, newStatus)
// would this be a case for currying? or some other functional tecq?

function makeNote(jsonObj) {
  var dir = getDir();
  var toMd = dir + '/note.md';
  var noteMd = fs.createWriteStream(toMd);
  Object.keys(jsonObj).map(function(title) {
    noteMd.write("# " + title + "\n");
    Object.keys(jsonObj[title]['items']).map(function(items, index){
      var status = jsonObj[title]['items'][items]['status'];
      var checkBox = '- [ ]';
      var itemIndex = ' ' + index + '.) ';
      if (status === 'complete') {
        checkBox = '- [x]';
      } else if (status === 'failed') {
        checkBox = '- [-]';
      }
      noteMd.write(checkBox + itemIndex + jsonObj[title]['items'][items]['description'] + "\n");
    });
    noteMd.write("\n");
  });
}

function addNote(noteObj, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var noteString = noteObj.reduce(function(memo, word){
    return memo + ' ' + word;
  });

  var descriptionObj = {
    description: noteString,
    status: 'incomplete',
  };

  // modify toData
  Object.keys(dataJSON).map(function(note){
    if (dataJSON[note]['cli-ref'] === key) {
      dataJSON[note]['items'].push(descriptionObj);
      fs.writeJsonSync(toData, dataJSON);
    }
  });
  makeNote(dataJSON);
}

function removeNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(dir + '/data.json');
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex){
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'].splice(index, 1);
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function completeNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'complete';
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function incompleteNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'incomplete';
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function failNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'failed';
      fs.writeJsonSync(toData, dataJSON);
      return makeNote(dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
}
function initializeNotes(userDir) {
  console.log(chalk.green('Success!'));
  var rcFile = process.env['HOME'] + '/.nonoterc.json';
  fs.closeSync(fs.openSync(rcFile, 'w'));

  var dotFileJSON = {}
  dotFileJSON.notesDirectory = userDir;

  fs.writeJsonSync(rcFile, dotFileJSON);
  console.log(' ');
  console.log(chalk.green('Success!'));
  console.log(' ');
  console.log('dotfile `.nonoterc.json` created at $HOME' );
  console.log(' ');
  console.log('Notes will be made in this directory: ')
  console.log(chalk.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}
function getConfig() {
  var config = process.env['HOME'] + '/.nonoterc.json';
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return fs.readJsonSync(config).notesDirectory;
}

function getDir(type) {
  var today = moment().format("DD-MM-YYYY");
  var notesDir = getConfig();
  var days = notesDir + '/days/';
  var toDir = days + today;
  return toDir;
}

function createDir(create, path) {
  var templateDest = path + '/templates/';
  var templateFile = path + '/templates/default.json';
  if (create) {
    fs.mkdirsSync(path);
    fs.mkdirsSync(templateDest);
    fs.closeSync(fs.openSync(templateFile, 'w'));
    fs.writeJsonSync(templateFile, templateJSON);
    console.log(' ');
    console.log(chalk.green('Success!'));
  } else {
    console.log(' ');
    console.log('Make sure that dir exists and has a templates dir in it with a note config!');
  }
}


program
  .version('0.0.1')
  .command('new [template]')
  .alias('n')
  .description('create a new note for the day')
  .action(function(template, cmd) {
    if(!template) {
      template = 'default';
    }
    var today = moment().format("DD-MM-YYYY");
    var dir = getConfig() + '/';
    var notePath = dir + today;
    var templateData = dir + 'templates/' + template + '.json';

    console.log('notePath:', notePath);
    console.log(chalk.cyan('creating new note for today!'));

    // fs.mkdirsSync(notePath);
    // fs.copySync(templateData, noteData);
    // makeNote(dataJSON);

    console.log(chalk.white('new note created for: ') + chalk.bold.green(today));
  });

program
  .command('init')
  .description('initializes notes')
  .action(function(cmd) {
    cmdValue = cmd;
    co(function *() {

      var notesDirPath = yield prompt('notes directory path (from $HOME): ');
      var homePath = process.env['HOME'] + '/' + notesDirPath;
      initializeNotes(homePath);

      var shouldCreate = yield prompt.confirm('Would you like me to create "' + homePath + '" for you?(Recommended) [y/N] ');
      createDir(shouldCreate, homePath);
      console.log('Start taking notes with ' + chalk.cyan('nonote new!'));
      // TODO: create a readme
      process.exit();
    })
  });

program
  .command('add [cli-ref] <notes...>')
  .alias('a')
  .description('add note to object')
  .action(function(ref, note, cmd) {
    try {
      addNote(note, ref);
      console.log(chalk.green('note added!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('remove [cli-ref] <index>')
  .alias('r')
  .description('remove note from note object')
  .action(function(ref, note, cmd) {
    try {
      removeNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was removed!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('complete [cli-ref] <index>')
  .alias('c')
  .description('mark item as complete')
  .action(function(ref, note, cmd) {
    try {
      completeNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as complete!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('incomplete [cli-ref] <index>')
  .alias('i')
  .description('mark item as incomplete')
  .action(function(ref, note, cmd) {
    try {
      incompleteNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as incomplete!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('failed [cli-ref] <index>')
  .alias('f')
  .description('mark item as failed')
  .action(function(ref, note, cmd) {
    try {
      failNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as failed :('));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

  program.parse(process.argv);

  /* eslint-enable*/