const {endpoints} = require('./config');

async function GetRoomInfoFlask(roomid) {
    var method = 'GetRoomInfo';
    return fetch(endpoints.dev + method + "?roomid=" + roomid, {
        method: 'get'
    }).then( (response) => response.text() 
    ).then( (data) => {
        return data;
    }).catch( (error) => {
        return error;
    })
};
