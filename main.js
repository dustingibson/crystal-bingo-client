const {app, BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
const {ipcMain} = require('electron');
const processQuery = require('./query');
const fetch = require('isomorphic-fetch');

function openModal(winParent) {
  let win = new BrowserWindow({
    parent: winParent,
    modal: true
  });
  win.loadFile('index.html');
}

const endpoints = {
  dev: "http://localhost:5000/"
};

async function UpdateRoomInfoFlask(userid, results) {
  var method = 'UpdateResults';
  return fetch(endpoints.dev + method + "?userid=" + userid + "&results=" + results, {
      method: 'post'
  }).then( (response) => response.text() 
  ).then( (data) => {
      return data;
  }).catch( (error) => {
      return error;
  })
};

function createWindow () {
    let win = new BrowserWindow({ width: 800, height: 600 });
    //win.loadFile('bingo.html');
    win.loadURL(url.format ({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
   }));
  }

  ipcMain.on('getcard', (event, arg) => {
  });

  ipcMain.on('updatecard', async (event, bingoCard, info) => {
    console.log(info.userinfo[0].result);
    var results = processQuery(bingoCard, info.userinfo[0].result);
    var response = await UpdateRoomInfoFlask(info.userinfo[0].id, results);
    console.log(response);
  });
  
  app.on('ready', createWindow);