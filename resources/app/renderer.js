// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const electron = require('electron');
const process = require('process');
const path = require('path');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('keepitsecretkeepitsafe');
const sql = require('mssql');
const { dialog, app } = require('electron').remote;
const BrowserWindow = electron.remote.BrowserWindow;
const WIN = electron.remote.getCurrentWindow();
const fs = require('fs');
const readline = require('readline');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const windows = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(windows);
window.$ = window.jQuery = require('jquery'); // not sure if you need this at all
window.Bootstrap = require('bootstrap');
window.Popper = require('popper.js');
//const clean = DOMPurify.sanitize('<img src=x onerror=alert(1)//>');

// SQL configuration
let sqlConfig = {
  user: 'user',
  password: 'password',
  server: 'servername',
  database: 'dbname',
  options: {
    encrypt: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

// Initialize global variables, small program
let fileTypeUsed = 'csv';
let lineContents = '';
let lineContentsMatch = '';
let lineContentsCount = '';
let invLineNo = 0;
let dbLineNo = 0;
let dbItemsArray = [];
let cleanFileString = '';
let invalidFileString = '';
let databaseUse = false;
var dbConfigChecks = [];
var dbConfigValidChecks = [];
let serverName = 'ezserver';
let dbName = 'ibscore';
let depts = [];
let InvFileAdded = false;
let DBFileAdded = false;
let DBFileDeptAdded = false;
let userNameConfig = 'username';
let userPWConfig = 'password';
let serverNameConfig = 'sqlexpress';
let dbNameConfig = 'sqlexpress';

// Obtain database configuration, store returned array of values in a variable
// Sets the dbConfigChecks/Out variables used for checking the database config file
getDBConfig();

// popovers Initialization
$(function () { $('#copyDBQuery').popover({ container: 'body' }); });

// Main Page
$('#dirtyFileBTN').on('click', function (event) {
  try {
    let fileDiag = dialog.showOpenDialog({
      filters: [
        { name: 'CSV/Text', extensions: ['txt', 'csv'] },
        //{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
        //{ name: 'Custom File Type', extensions: ['as'] },
        //{ name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile' /*, 'multiSelections'*/]
    });

    fileDiag.then(function (item) {
      try {
        if (
          item.canceled == true ||
          item.filePaths == [] ||
          item.filePaths == null ||
          item.filePaths == undefined ||
          item.filePaths == '') {

          // Failed, do nothing
          return false;
        } else {
          let uploadPath = String(item.filePaths);
          let fileSize = parseInt(getFilesizeInBytes(uploadPath));
          let maxSize = 5000000;
          if (fileSize > maxSize) {
            const options = {
              type: 'info',
              buttons: ['Okay'],
              title: 'Max File Size',
              message: 'The max file size is 5MB, select a file less than that size.'
            }
            dialog.showMessageBox(null, options);
          } else {
            if (item.filePaths != '' && item.filePaths != null && item.filePaths != undefined) {
              // Set filetype variable for determining how to parse file later on
              if (uploadPath.indexOf('.txt') != -1) { fileTypeUsed = 'txt'; }
              fs.readFile(String(item.filePaths), 'utf-8', function (err, data) {
                if (err) {
                  //dialog.showErrorBox('Error', String(err));
                } else {
                  fs.writeFile(path.join(__dirname + '/docs/input/InventoryFile.csv'), data, function (writeErr) {
                    if (writeErr) {
                      //dialog.showErrorBox('Error', String(writeErr));
                    } else {
                      // Assign variable true to let the program know 1 of 2 pre-requisites are ready
                      InvFileAdded = true;

                      // Update user with green text, letting them know the file was added successfully
                      $('#invFileAdd').removeClass('notAdded');
                      $('#invFileAdd').addClass('added');
                      $('#invFileAdd').text('Inventory File Added Successfully!');

                      // Update Checkboxes on buttons
                      $('#dirtyFileCheck').removeClass('hidden').addClass('check');
                    }
                  });
                }
              });
            }
          }
        }
      } catch (err) {
        dialog.showErrorBox('Error', String(err));
      }

    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});

$('#dbFileBTN').on('click', function (event) {
  try {
    let fileDiag = dialog.showOpenDialog({
      filters: [
        { name: 'CSV/Text', extensions: ['txt', 'csv'] },
        //{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
        //{ name: 'Custom File Type', extensions: ['as'] },
        //{ name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile' /*, 'multiSelections'*/]
    });

    fileDiag.then(function (item) {
      try {
        if (
          item.canceled == true ||
          item.filePaths == [] ||
          item.filePaths == null ||
          item.filePaths == undefined ||
          item.filePaths == '') {

          // Failed, do nothing
          return false;
        } else {
          // No issues, proceed
          let uploadPath = String(item.filePaths);
          let fileSize = parseInt(getFilesizeInBytes(uploadPath));
          let maxSize = 5000000;
          if (fileSize > maxSize) {
            const options = {
              type: 'info',
              buttons: ['Okay'],
              title: 'Max File Size',
              message: 'The max file size is 5MB, select a file less than that size.'
            }
            dialog.showMessageBox(null, options);
          } else {
            fs.readFile(String(item.filePaths), 'utf-8', function (err, data) {
              if (err) {
                dialog.showErrorBox('Error', String(err));
              } else {
                fs.writeFile(path.join(__dirname + '/docs/input/DatabaseFile.csv'), data, function (err) {
                  if (err) {
                    //dialog.showErrorBox('Error', String(err));
                    dialog.showErrorBox('Error', String(err));
                  } else {
                    // Assign variable true to let the program know 1 of 2 pre-requisites are ready
                    DBFileAdded = true;

                    // Update user with green text, letting them know the file was added successfully
                    $('#invDBAdd').removeClass('notAdded');
                    $('#invDBAdd').addClass('added');
                    $('#invDBAdd').text('Database File Added Successfully!');

                    // Update Checkboxes on buttons
                    $('#dbFileCheck').removeClass('hidden').addClass('check');
                  }
                });
              }
            });
          }
        }
      } catch (err) {
        dialog.showErrorBox('Error', String(err));
      }


    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});

$('#submitBTN').on('click', function () {
  // Check that both files were added
  try {
    if (InvFileAdded === true && DBFileAdded === true || InvFileAdded == true && DBFileDeptAdded === true) {

      // Open DB file and create an array using its line by line contents
      let readDBFileInterface = readline.createInterface({
        input: fs.createReadStream(path.join(__dirname + '/docs/input/DatabaseFile.csv'))
      });

      readDBFileInterface.on('line', function (line) {
        // Database file should not have commas or spaces, treat it like a TXT type anway
        dbItemsArray.push(String(line).trim());
      });

      // Open Inventory file and compare against DB array, non-matches
      // will be moved to a separate file called InvalidItems.csv
      let readInvFileInterface = readline.createInterface({
        input: fs.createReadStream(path.join(__dirname + '/docs/input/InventoryFile.csv'))
      });

      readInvFileInterface.on('line', function (line) {
        if (fileTypeUsed == 'csv') {
          // Parse it as a csv file, parse files that are only ItemNO, NumOfItems format
          lineContents = String(line);
          lineContents = lineContents.split(',');
          lineContentsMatch = String(lineContents[0]);
          lineContentsCount = parseInt(parseInt(lineContents[1]).toFixed(0));

          // If either lineContentsMatch or lineContentsCount are undefined (don't exist), add them to InvalidList
          if (
            lineContentsMatch == undefined ||
            lineContentsCount == undefined ||
            lineContentsMatch.length > 20 ||
            lineContentsCount.length > 4 ||
            lineContentsCount > 9999 ||
            isNaN(lineContentsCount) ||
            lineContentsMatch.match(/A-Za-Z0-9 ,/gi) ||
            lineContentsMatch.match(/A-Za-Z0-9 ,/gi)
          ) {
            invalidFileString += `${lineContentsMatch}, ${lineContentsCount}\n`;
          } else {
            // For each line item in InventoryFile, check line against DB array for a match
            // If no match is found, append to InvalidItems string, else append to ValidItems string
            if (dbItemsArray.includes(lineContentsMatch)) {
              cleanFileString += `${lineContentsMatch},${lineContentsCount}\n`;
            } else {
              invalidFileString += `${lineContentsMatch},${lineContentsCount}\n`;
            }
          }

        } else {
          // Parse it as a txt file, parse files that are only ItemNO NumOfItems -- no commas
          // Parse it as a csv file, parse files that are only ItemNO, NumOfItems format
          lineContents = String(line);
          lineContents = lineContents.split(' ');
          lineContentsMatch = String(lineContents[0]);
          lineContentsCount = parseInt(parseInt(lineContents[1]).toFixed(0));

          // If either lineContentsMatch or lineContentsCount are undefined (don't exist), add them to InvalidList
          if (
            lineContentsMatch == undefined ||
            lineContentsCount == undefined ||
            lineContentsMatch.length > 20 ||
            lineContentsCount.length > 4 ||
            lineContentsCount > 9999 ||
            isNaN(lineContentsCount) ||
            lineContentsMatch.match(/A-Za-Z0-9 ,/gi) ||
            lineContentsMatch.match(/A-Za-Z0-9 ,/gi)
          ) {
            invalidFileString += `${lineContentsMatch}, ${lineContentsCount}\n`;
          } else {
            // For each line item in InventoryFile, check line against DB array for a match
            // If no match is found, append to InvalidItems string, else append to ValidItems string
            if (dbItemsArray.includes(lineContentsMatch)) {
              cleanFileString += `${lineContentsMatch},${lineContentsCount}\n`;
            } else {
              invalidFileString += `${lineContentsMatch},${lineContentsCount}\n`;
            }
          }
        }
      }).on('close', function () {
        // After parsing and string have been run, append text to 2 files, 1 for clean, 1 for invalid items files
        // Write CleanInventoryFile.
        fs.writeFile(path.join(__dirname + '/docs/output/CleanInventoryFile.csv'), cleanFileString, function (writeErr) {
          if (writeErr) {
            dialog.showErrorBox('Error', String(writeErr));
          } else {
            let saveOptions = {
              //Placeholder 1
              title: "CleanInventoryFile",

              //Placeholder 2
              defaultPath: app.getPath("desktop"),

              //Placeholder 4
              buttonLabel: "Save File",

              //Placeholder 3
              filters: [
                { name: 'CSV', extensions: ['csv'] }
              ]
            }

            dialog.showSaveDialog(WIN, saveOptions, function (filePath) {
              // Do nothing because this uses promises instead of call backs
            }).then(function (data) {
              if (data.filePath != undefined) {
                // Filepath is provided, use this to save the document in docs/input/CleanInventoryFile.csv
                fs.writeFile(String(data.filePath), cleanFileString, function (saveErr) {
                  if (saveErr) {
                    // Do nothing -- dialog.showErrorBox('Error', String(saveErr));
                  } else {
                    // Update message section to include 'Clean File Generated Successfully'
                    $('#cleanAdd').removeClass('notAdded');
                    $('#cleanAdd').addClass('added');
                    $('#cleanAdd').text('Clean Inventory File Saved!');


                    // File written successfully, change button to allow program reload for another upload
                    // Check if both pre-req files are uploaded first, don't just change the button blue any time its clicked
                    if (
                      InvFileAdded === true && DBFileAdded === true ||
                      InvFileAdded == true && DBFileDeptAdded === true
                    ) {
                      // Pre-reqs met, proceed to change button color
                      $('#submitBTN').addClass('bluebg');
                      $('#submitBTN').text(`Saved! Press to reload`).append(`<span class='num2'>&#x2778; </span><span class='check'>&#x2714;</span>`);
                      $('#reloadMSG').addClass('blueText').text(`File saved to ${data.filePath}`).removeClass('opacity0').addClass('opacity100');
                      $('#submitBTN').off().on('click', function () {
                        location.reload();
                      });

                      // Allow saving invalid file, append file after submitBTN then add event listener to newly added invalid file button
                      $('#submitBTN').after("<button id='getInvalidBTN' class='getInvalidBTN' type='button'><span class='num2'>&#x2779; </span><span class='check'>&#x2714;</span>Get Invalid Inventory File</button>");
                      $('#getInvalidBTN').on('click', function (event) {
                        event.preventDefault();

                        // Prompt to save file
                        saveInvalidFile();
                      });
                    }
                  }
                });
              }
            });
          }
        });

        // Write InvalidInventorFile.csv
        fs.writeFile(path.join(__dirname + '/docs/output/InvalidInventoryFile.csv'), invalidFileString, function (writeErr) {
          if (writeErr) {
            dialog.showErrorBox('Error', String(writeErr));
          }
        });
      });
    } else {
      const options = {
        type: 'info',
        buttons: ['Okay'],
        title: 'Inventory & DB File',
        message: 'The Inventory and Database Reference file must both be present to proceed.'
      }
      dialog.showMessageBox(null, options);
    }

  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }

});
// Info Page
$('#infoBTN').on('click', function () {
  try {
    let window = electron.remote.getCurrentWindow();
    window.close();
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});



// Helper Functions
function getFilesizeInBytes(filename) {
  try {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }

}

function getDBConfig() {
  try {
    // Determine if the config file exists, if not enable db file upload button instead of select department
    fs.exists(path.join(__dirname + '/config/config.txt'), function (exists) {
      if (exists) {
        fs.readFile(path.join(__dirname + '/config/config.txt'), (err, data) => {
          if (err) {
            databaseUse = false;
            $('#dbFileBTN').removeClass('hidden');
            $('#dbConnectBTN').text('Use Database Configuration');
          } if (data) {
            // Decrypt data, and write it to the config file, read it and encrypt again
            data = cryptr.decrypt(data);

            // Write unencrypted file
            fs.writeFile(path.join(__dirname + '/config/config.txt'), data, function (err) {
              if (err) {
                dialog.showErrorBox('Error', String(err));
              }
            });

            // Read data and return an array of values for config information
            let readConfigFile = readline.createInterface({
              input: fs.createReadStream(path.join(__dirname + '/config/config.txt'))
            });

            // Initialize check variables the top 4 lines of the config file
            let configLineNum = 0;

            // Check each line of the config file
            readConfigFile.on('line', function (line) {
              // Trim white space from both sides
              line = String(line).trim();

              // Check the top 4 lines of the file
              if (configLineNum == 0) {
                if (checkInvalid(line) == false) {
                  dbConfigValidChecks[0] = false;
                } else {
                  if (line.indexOf('USERNAME: "') != -1) {
                    line = line.replace('USERNAME: "', '');
                    line = line.replace('"', '');
                    dbConfigChecks[0] = line;
                    dbConfigValidChecks[0] = true;
                  } else {
                    dbConfigValidChecks[0] = false;
                  }
                }
              }

              if (configLineNum == 1) {
                if (checkInvalid(line) == false) {
                  dbConfigValidChecks[1] = false;
                } else {
                  if (line.indexOf('PASSWORD: "' != -1)) {
                    line = line.replace('PASSWORD: "', '');
                    line = line.replace('"', '');
                    dbConfigChecks[1] = line;
                    dbConfigValidChecks[1] = true;
                  } else {
                    dbConfigValidChecks[1] = false;
                  }
                }
              }

              if (configLineNum == 2) {
                if (checkInvalid(line) == false) {
                  dbConfigValidChecks[2] = false;
                } else {
                  if (line.indexOf('SERVER: "' != -1)) {
                    line = line.replace('SERVER: "', '');
                    line = line.replace('"', '');
                    dbConfigChecks[2] = line;
                    dbConfigValidChecks[2] = true;
                  } else {
                    dbConfigValidChecks[2] = false;
                  }
                }
              }

              if (configLineNum == 3) {
                if (checkInvalid(line) == false) {
                  dbConfigValidChecks[3] = false;
                } else {
                  if (line.indexOf('DATABASENAME: "' != -1)) {
                    line = line.replace('DATABASENAME: "', '');
                    line = line.replace('"', '');
                    dbConfigChecks[3] = line;
                    dbConfigValidChecks[3] = true;
                  } else {
                    dbConfigValidChecks[3] = false;
                  }
                }
              }
              // Add one to the line count to do conditional statements based on line num #
              configLineNum++;
            });

            readConfigFile.on('close', () => {
              try {
                // Return object array of true/false values, if false exists for any value, enable file upload - else use database
                dbConfigValidChecks = [dbConfigValidChecks[0], dbConfigValidChecks[1], dbConfigValidChecks[2], dbConfigValidChecks[3]];
                dbConfigChecks = [dbConfigChecks[0], dbConfigChecks[1], dbConfigChecks[2], dbConfigChecks[3]];

                // Encrypt file again
                data = cryptr.encrypt(data);

                // Write file to config
                fs.writeFile(path.join(__dirname + '/config/config.txt'), data, function (err) {
                  if (err) {
                    dialog.showErrorBox('Error', String(err));
                  }
                });

                // Proceed to get departments
                getDepartments();
              } catch (err) {
                dialog.showErrorBox('Error', String(err));
              }

            });
          }
        });
      } else {
        // Doesn't exist, enable file upload buttons/views
        databaseUse = false;
        $('#dbFileBTN').removeClass('hidden');
        $('#dbConnectBTN').text('Use Database Connection');
      }
    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }


}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

function getDepartments() {
  // Initialize department HTML string used to build select options on the front end
  let deptHTMLString = '';

  try {
    // Check if using database by determining if the configuration file is filled out
    if (dbConfigValidChecks[0] == true && dbConfigValidChecks[1] == true && dbConfigValidChecks[2] == true && dbConfigValidChecks[3] == true) {
      // Data is entered, check if values are empty or invalid, if so enable file upload, else enable database usage
      // Filter database and sql instance name
      userNameConfig = String(dbConfigChecks[0]);
      userPWConfig = String(dbConfigChecks[1]);
      serverName = String(dbConfigChecks[2]);
      dbName = String(dbConfigChecks[3]);

      // Check if empty, null or undefined, if so convert to default values
      // default values will fail, that is the point, can be checked for default values
      // to determine if invalid credentials were caught instead of handling nulls and undefineds
      if (checkInvalid(userNameConfig) == false) {
        userNameConfig = 'user';
      }

      if (checkInvalid(userPWConfig) == false) {
        userPWConfig = 'password';
      }

      if (checkInvalid(serverName) == false) {
        serverName = 'servername';
      }

      if (checkInvalid(dbName) == false) {
        dbName = 'dbname';
      }

      // Trim
      userNameConfig = userNameConfig.trim();
      userPWConfig = userPWConfig.trim();
      serverName = serverName.trim();
      dbName = dbName.trim();

    } else {
      try {
        // Not valid, enable file upload button
        $('#reloadMSG').addClass('blueText').removeClass('opacity0').addClass('opacity100').text('No Databae Config Found. Manual Mode Enabled.');
      } catch (err) {
        dialog.showErrorBox('Error', String(err));
      }
    }
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }

  try {
    // Sanitize serverName and dbName
    userNameConfig = DOMPurify.sanitize(userNameConfig);
    userPWConfig = DOMPurify.sanitize(userPWConfig);
    serverName = DOMPurify.sanitize(serverName);
    dbName = DOMPurify.sanitize(dbName);

    // SQL configuration
    sqlConfig = {
      user: userNameConfig,
      password: userPWConfig,
      server: serverName,
      database: dbName,
      options: {
        encrypt: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    }
    // Run query to obtain departments for showing in the app
    sql.connect(sqlConfig, err => {
      let connErr = false;
      // ... error checks

      const request = new sql.Request();
      request.stream = true; // You can set streaming differently for each request
      request.query(`use ${dbName} select strname, uiddeptid from tbldepts where blnactive = '1' and blnadmin = '0'`); // or request.execute(procedure)

      request.on('recordset', columns => {
        // Emitted once for each recordset in a query
      });

      request.on('row', row => {
        // Emitted for each row in a recordset
        // Sanitize strname and uiddeptid before adding them to depts array
        row.strname = DOMPurify.sanitize(String(row.strname));
        row.uiddeptid = DOMPurify.sanitize(String(row.uiddeptid));

        deptHTMLString += `<option class='${row.uiddeptid}'>${row.strname}</option>`;
        // Also add to departments array for checking validity later from html selection form
        depts.push([row.strname, row.uiddeptid]);
      });

      request.on('error', err => {
        // May be emitted multiple times
        if (err) {
          // Enable manual file entry silently, else enable database mode
          connErr = true;
        }
      });

      request.on('done', result => {
        if (connErr == true) {
          try {
            // Not valid, enable file upload button
            databaseUse = false;
            $('#dbFileBTN').removeClass('hidden');
            $('#reloadMSG').addClass('blueText').removeClass('opacity0').addClass('opacity100').text('No Databae Config Found. Manual Mode Enabled.');
            $('#dbConnectBTN').text('Use Database Configuration');
          } catch (err) {
            dialog.showErrorBox('Error', String(err));
          }
        } else {
          // No error
          $('#dbDeptSelection').append(deptHTMLString);
          $('#dbDeptSelection').removeClass('hidden');
          $('#dbDeptDescription').removeClass('hidden');
          $('#dbConnectBTN').text('Change Database Configuration');
          $('#deptSelected').on('click', function () {
            // Fire next steps for database reference department selection
            let dbDeptSelected = $('#dbDeptSelection option:selected').text();

            // sanitize dbDeptSelected
            DOMPurify.sanitize(dbDeptSelected);

            // Show changes via messages on the front end
            $('#invDBAdd').text(`Database Reference Set To ${dbDeptSelected}`);
            $('#invDBAdd').removeClass('notAdded');
            $('#invDBAdd').addClass('added');

            // Update Checkboxes on buttons
            $('#dbDeptFileCheck').removeClass('hidden').addClass('check')

            // Lastly set the variable used in checking to make sure both files are present
            DBFileDeptAdded = true;

            // Get database reference file from the database by department
            getDeptRefFile(dbDeptSelected, sqlConfig, depts);
          });
        }

      });
    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
}

function getDeptRefFile(str_dept, sqlconfig, array_depts) {
  try {
    let selectedDeptGuid = '';
    if (DBFileDeptAdded === true) {
      // Obtain uiddeptid for use in query from the dept array for use in the database
      for (deptItem in array_depts) {
        // Encode &amp; back into & when comparing dept names if it exists in the name
        array_depts[deptItem][0] = String(array_depts[deptItem][0]).replace('&amp;', '&');
        if (array_depts[deptItem][0] == str_dept) {
          // Set selectedDeptGuid as uiddeptid for DB query
          selectedDeptGuid = String(array_depts[deptItem][1]);
        }
      }

      // Now that's out of the way, perform SQL query for data based on department
      let dbRefString = ''; // Holds appended string of data to write the DB reference file with
      let sqlItemQuery = `use ${dbName} select strnumber from tblinvitems where blnstockitem = '1' and blnistemplate = '0' and blndeleted = '0' and strnumber <> '' and uidsellableitemid in (select uidsellableitemid from tblsellableitems where uiddeptid = '${selectedDeptGuid}' and blnkitparentitem = '0')`;
      // Run query to obtain departments for showing in the app
      sql.connect(sqlconfig, err => {
        // ... error checks

        const request = new sql.Request();
        request.stream = true; // You can set streaming differently for each request
        request.query(sqlItemQuery); // or request.execute(procedure)

        request.on('recordset', columns => {
          // Emitted once for each recordset in a query
        });

        request.on('row', row => {
          // Place row data into a string, append string with new data, use string to create file when completed
          dbRefString += `${row.strnumber}\n`;
        });

        request.on('error', err => {
          // May be emitted multiple times

        });

        request.on('done', result => {
          fs.writeFile(path.join(__dirname + '/docs/input/DatabaseFile.csv'), dbRefString, function (err) {
            if (err) {
              dialog.showErrorBox('Error', String(err));
            } else {
              DBFileAdded = true;
              // Update user with green text, letting them know the file was added successfully
              $('#invDBAdd').removeClass('notAdded');
              $('#invDBAdd').addClass('added');
              $('#invDBAdd').text('Database File Added Successfully!');
            }
          });
        });
      });
    }
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
}

// Front End Actions
$('#downloadRefFile').on('click', function (event) {
  event.preventDefault();
  let configTemplateString = '';

  try {
    let readTemplateFileInterface = readline.createInterface({
      input: fs.createReadStream(path.join(__dirname + '/config/config_template.txt'))
    });

    readTemplateFileInterface.on('line', function (line) {
      // Database file should not have commas or spaces, treat it like a TXT type anway
      line = String(line).trim();
      configTemplateString += `${line}\n`;
    });

    // Declare save options
    let saveTemplateOptions = {
      //Placeholder 1
      title: "Save Template File",

      //Placeholder 2
      defaultPath: app.getPath("desktop"),

      //Placeholder 4
      buttonLabel: "Save File",

      //Placeholder 3
      filters: [
        { name: 'Txt', extensions: ['txt'] }
      ]
    }

    dialog.showSaveDialog(WIN, saveTemplateOptions, function (filePath) {
      // Do nothing because this uses promises instead of call backs
    }).then(function (data) {
      if (data.filePath != undefined) {
        // Filepath is provided, use this to save the document in docs/input/CleanInventoryFile.csv
        fs.writeFile(String(data.filePath), configTemplateString, function (saveErr) {
          if (saveErr) {
            //dialog.showErrorBox('Error', String(saveErr));
          }
        });
      }
    })
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});

$('#copyDBQuery').on('click', function (event) {
  try {
    event.preventDefault();

    let strquery = "select strnumber from tblinvitems where blnstockitem = '1' and blnistemplate = '0' and blndeleted = '0' and strnumber <> '' and uidsellableitemid in (select uidsellableitemid from tblsellableitems where uiddeptid in (select uiddeptid from tbldepts where strname = 'Golf & Tennis') and blnkitparentitem = '0')";

    const copyToClipboard = strquery => {
      const el = document.createElement('textarea');  // Create a <textarea> element
      el.value = strquery;                                 // Set its value to the string that you want copied
      el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
      el.style.position = 'absolute';
      el.style.left = '-9999px';                      // Move outside the screen to make it invisible
      document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
      const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
          ? document.getSelection().getRangeAt(0)     // Store selection if found
          : false;                                    // Mark as false to know no selection existed before
      el.select();                                    // Select the <textarea> content
      document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
      document.body.removeChild(el);                  // Remove the <textarea> element
      if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
      }
    };

    copyToClipboard(strquery);

    // Used to keep popup from disappearing immediately
    $('#copyDBQuery').focus();
  } catch {

  }

});

$('#dbConfigConfirm').on('click', function (event) {
  event.preventDefault();

  try {
    // Obtain servername/dbname for server connection testing from user input
    userNameConfig = $('#username').val();
    userPWConfig = $('#password').val();
    serverNameConfig = $('#servername').val();
    dbNameConfig = $('#dbname').val();

    // Sanitize input
    userNameConfig = userNameConfig.trim();
    userPWConfig = userPWConfig.trim();
    serverNameConfig = serverNameConfig.trim();
    dbNameConfig = dbNameConfig.trim();

    userNameConfig = DOMPurify.sanitize(userNameConfig);
    userPWConfig = DOMPurify.sanitize(userPWConfig);
    serverNameConfig = DOMPurify.sanitize(serverNameConfig);
    dbNameConfig = DOMPurify.sanitize(dbNameConfig);

    // Add Checking message to let the user know they clicked the button
    $('#dbConMsg').removeClass('notAdded').addClass('blueText');
    $('#dbConMsg').text('DB Status: Attempting to Connect ...');

    if (
      checkInvalid(userNameConfig) == true &&
      checkInvalid(userPWConfig) == true &&
      checkInvalid(serverNameConfig) == true &&
      checkInvalid(dbNameConfig) == true) {

      // SQL configuration
      sqlConfig = {
        user: userNameConfig,
        password: userPWConfig,
        server: serverNameConfig,
        database: dbNameConfig,
        options: {
          encrypt: true
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      }

      // Run query to obtain departments for showing in the app
      sql.close(); // Close any program based running connections any time re-saving data
      sql.connect(sqlConfig, err => {
        let errEncountered = false;
        if (err) { errEncountered = true }
        // ... error checks

        const request = new sql.Request();
        request.stream = true; // You can set streaming differently for each request
        request.query(`use ${dbName} select db_name();`); // or request.execute(procedure)

        request.on('recordset', columns => {
          // Emitted once for each recordset in a query
        });

        request.on('row', row => {
          // Emitted for each row in a recordset
        });

        request.on('error', err => {
          // May be emitted multiple times
          if (err) {
            // Enable manual file entry silently, else enable database mode
            errorEncountered = true;

            // Update modal message to display failed check
            $('#dbConMsg').removeClass('blueText added');
            $('#dbConMsg').addClass('redText');
            $('#dbConMsg').text('DB Status: Failed to connect');
          }
        });

        request.on('done', result => {
          if (errEncountered != true) {
            let configFileStr = '';
            // Update modal message to indicate a successful connection
            $('#dbConMsg').removeClass('blueText redText');
            $('#dbConMsg').addClass('added');
            $('#dbConMsg').text('DB Status: Connection Successful');

            // Build String
            configFileStr += `USERNAME: "${userNameConfig}"\n`;
            configFileStr += `PASSWORD: "${userPWConfig}"\n`;
            configFileStr += `SERVER: "${serverNameConfig}"\n`;
            configFileStr += `DATABASENAME: "${dbNameConfig}"\n`;
            configFileStr = cryptr.encrypt(configFileStr);

            fs.writeFile(path.join(__dirname + '/config/config.txt'), configFileStr, function (err) {
              if (err) {
                dialog.showErrorBox('Error', String(err));
              } else {
                // Update modal message to indicate a successful connection
                $('#dbConMsg').removeClass('added redText');
                $('#dbConMsg').addClass('blueText');
                $('#dbConMsg').text('Credentials Saved! Reload Ready');
                $('#dbConfigConfirm').addClass('bluebg');
                $('#dbConfigConfirm').text('Save and Continue');

                $('#dbConfigConfirm').on('click', function (event) {
                  event.preventDefault();
                  location.reload();
                });
              }
            });
          }

        });
      });
      // Valid, continue to check database using provided credentials
    } else {
      // Update modal message to display failed check
      $('#dbConMsg').removeClass('blueText');
      $('#dbConMsg').addClass('redText');
      $('#dbConMsg').text('DB Status: Failed - Invalid Credentials');
    }
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});

$('#dbDelBTN').on('click', function (event) {
  event.preventDefault();
  try {
    fs.exists(path.join(__dirname + '/config/config.txt'), function (exists) {
      if (exists) {
        // Exists, continue to delete it, else display message that it doesn't exist
        fs.unlink(path.join(__dirname + '/config/config.txt'), function (err) {
          if (err) {
            dialog.showErrorBox('Error', String(err));
          } else {
            // File removed, reload application to check load file upload version
            $('#reloadMSG').removeClass('opacity0').addClass('opacity100 blueText').text('Database File Deleted. Reloading application in 2 seconds.');
            setTimeout(function () {
              // Basically giving the user time enough to read the message
            }, 2000);
            location.reload();
          }
        });
      } else {
        // Display doesn't exist message
        let missingFileOptions = {
          type: 'info',
          buttons: ['Okay'],
          title: 'Configuration File Missing',
          message: 'Configuration File Has Already Been Deleted'
        }
        dialog.showMessageBox(null, missingFileOptions);
      }
    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }
});

function checkInvalid(string) {
  // Returns true or false
  if (
    string != null &&
    string != undefined &&
    string != '') {
    return true;
  } else {
    return false;
  }
}

function saveInvalidFile() {
  try {
    let invalidFileOptions = {
      //Placeholder 1
      title: "InvalidInventoryFile",

      //Placeholder 2
      defaultPath: app.getPath("desktop"),

      //Placeholder 4
      buttonLabel: "Save File",

      //Placeholder 3
      filters: [
        { name: 'CSV', extensions: ['csv'] }
      ]
    }

    // Get string of saved invalid file, then use it to write the file where the user says to
    // Open DB file and create an array using its line by line contents
    fs.exists(path.join(__dirname + '/docs/output/InvalidInventoryFile.csv'), function (exists) {
      if (exists) {
        // Proceed
        let invalidFileStr = '';
        let readInvalidFileInterface = readline.createInterface({
          input: fs.createReadStream(path.join(__dirname + '/docs/output/InvalidInventoryFile.csv'))
        });

        readInvalidFileInterface.on('line', function (line) {
          // Database file should not have commas or spaces, treat it like a TXT type anway
          line = String(line).trim();
          line = DOMPurify.sanitize(line);
          invalidFileStr += `${line}\n`;
        });

        // Invalid File Read and appended to string, use string to save to user selected file path
        dialog.showSaveDialog(WIN, invalidFileOptions, function (filePath) {
          // Do nothing because this uses promises instead of call backs
        }).then(function (data) {
          if (data.filePath != undefined) {
            // Filepath is provided, use this to save the document in docs/input/CleanInventoryFile.csv
            fs.writeFile(String(data.filePath), invalidFileStr, function (saveErr) {
              if (saveErr) {
                //dialog.showErrorBox('Error', String(saveErr));
              }
            });
          }
        });
      } else {
        // Throw message that file doesn't exist
        let invalidFileOptions = {
          type: 'info',
          buttons: ['Okay'],
          title: 'Invalid File Missing',
          message: 'The Invalid Inventory File is Missing. Regenerate file and try again.'
        }
        dialog.showMessageBox(null, invalidFileOptions);
      }
    });
  } catch (err) {
    dialog.showErrorBox('Error', String(err));
  }

}

// Catch all uncaught exception errors and log them to a log file
process.on('uncaughtexception', function (err) {
  if (err) {
    let errStr = String(err);
    let errTimeStamp = new Date();
    errTimeStamp.toISOString();
    errStr += `${errTimeStamp}\n`;
  }
  fs.appendFile(path.join(__dirname + 'errorlog.txt'), errorStr, function (err) {
    //
  });
});