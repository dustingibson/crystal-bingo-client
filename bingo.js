const {ipcRenderer, ipcMain} = require('electron');


const endpoints = {
    dev: "http://localhost:5000/"
};

var bingoCard = null;

async function GetRoomInfoFlask(roomid) {
    var method = 'GetRoomInfo';
    return fetch(endpoints.dev + method + "?roomid=" + roomid, {
        method: 'get'
    }).then( (response) => response.text() 
    ).then( (data) => {
        return data;
    }).catch( (error) => {
        return error;
    });
};

async function GetInfoFlask(roomid, userid) {
    //ipcRenderer.send('query', );
    console.log("GETTING INFO");
    var method = 'GetInfo';
    return fetch(endpoints.dev + method + "?roomid=" + roomid + "&userid=" + userid, {
        method: 'get'
    }).then( (response) => response.text() 
    ).then( (data) => {
        return data;
    }).catch( (error) => {
        console.log(error);
        return error;
    });
};

async function UpdateBoard() {
    console.log("Test");
    var response = await GetInfoFlask(1,1);
    var card = JSON.parse(response);
    ipcRenderer.send('updatecard', bingoCard, card);
    for(var i=0; i < card.userinfo.length; i++) {
        var curUser = card.userinfo[i];
        for(var j=0; j < 25; j++) {
            var selector = '#' + j + "_" + curUser.name;
            console.log(selector);
            if(curUser.result[j] === "1") {
                $(selector).show();
            }
            else {
                $(selector).hide();
            }
        }
    }
}

window.onload = async function() {
    var response = await GetRoomInfoFlask(1,1);
    //console.log(JSON.parse(response));
    //ipcRenderer.send('card', JSON.parse(response));
    var card = JSON.parse(response);
    console.log(card);
    const cardList = document.getElementById('card');
    ipcRenderer.send('getcard', card);
    var cnt = 0;
    var html = "";
    bingoCard = card;
    for(var i = 0; i < 5; i++) {
      html += "<tr>";
      for(var j = 0; j < 5; j++) {
        html += "<td class='bingo-cell'><div class='description'>";
        html += card.squares[cnt].desc + "</div><br/>";
        for(var k = 0; k < card.userinfo.length; k++) {
            var curUser = card.userinfo[k];
            html += "<span class='marker' style='display: none; background-color:" + curUser.color + "' id='" + cnt + "_" + curUser.name + "'></span>"
        }
        html += "</td>";
        cnt = cnt + 1;
      }
      html += "</tr>";
    }
    cardList.innerHTML = html;
    setInterval(function(){ UpdateBoard(); }, 3000);
};

// ipcRenderer.on('card', (event, card) => {
//     console.log('IPC');
//     const cardList = document.getElementById('card');
//     var cnt = 0;
//     var html = "";
//     console.log(card.userinfo);
//     for(var i = 0; i < 5; i++) {
//       html += "<tr>";
//       for(var j = 0; j < 5; j++) {
//         html += "<td>";
//         html += card.squares[cnt]. desc;
//         for(var k = 0; k < card.userinfo.length; k++) {
//             var curUser = card.userinfo[k];
//             html += "<span class='marker' style='background-color=" + curUser.color + " id='" + cnt + "_" + curUser.name + "'></span>"
//         }
//         html += "</td>";
//         cnt = cnt + 1;
//       }
//       html += "</tr>";
//     }
//     cardList.innerText = html;
//   })