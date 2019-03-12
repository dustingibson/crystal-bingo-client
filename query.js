const { app, BrowserWindow } = require('electron');
const fs = require('fs');
 
var op =
{
    opCode : "",
    opList : [],
};
 
function evaluate( lftVal, ops, rhtVal) {
    var curOps = ops === "=" ? "===" : ops;
    var result = eval( lftVal + " " + curOps + " " + rhtVal );
    return result;
}
 
function toBinStr( val ) {
    return (val.charCodeAt(0) >>> 0).toString(2);
}
 
function countBin(val) {
    return val.indexOf('1') === -1 ? 0 : val.match((/1/g)||[]).length;
}
 
function getVal(b, addr, mode="dec", end=false) {
    //If dash does not exist
    if(addr.indexOf('-') === -1) {
        var intAddr = parseInt(addr,16);
        if(mode === "dec")
            return b[intAddr].charCodeAt(0);
        else if(mode === "bin")
            return toBinStr( b[intAddr] );
    }
    else {
        var sptAddr = addr.split('-');
        var fromAddr = parseInt(sptAddr[0],16);
        var toAddr = parseInt(sptAddr[1],16);
        //Inclusive
        var val = "";
        for(var i = fromAddr; i <= toAddr; i++) {
            if(mode === "dec") {
                hexStr = b[i].charCodeAt(0).toString(16);
                val += hexStr.length === 1 ? '0' + hexStr : hexStr;
            }
            else if(mode === "bin") {
                var bStr = toBinStr(b[i]).padStart(8, "0");
                if(end) {
                    bStr = bStr.split("").reverse().join("");
                }
                val += bStr.length === 1 ? '0' + bStr : bStr;
            }
        }
        if(mode === "dec")
            return parseInt(val, 16);
        else if(mode === "bin")
            return val;
    }
}
 
function processCMP(allSec,b) {
    var rhtVal = parseInt(allSec[3], 16);
    var lftVal = getVal(b, allSec[1]);
    var result = evaluate( lftVal, allSec[2], rhtVal )
    return [true, result];
}
 
//Run bitwise and compare to counts
//'BWCMP','ADDR', 'BITOP', 'BIN', 'OP', 'NUM']
function processBWCMP(allSec, b) {
    var b2 = getVal(b, allSec[1], "bin");
    var lftVal = runBitWiseCount(allSec[3], allSec[2], b2 );
    var rhtVal = parseInt(allSec[5], 10);
    var result = evaluate(lftVal, allSec[4], rhtVal);
    return [true, result];
}
 
//Run operation on a value in ADDR with counts of 1s
function processBCMP(allSec, b) {
    //var addr = parseInt(allSec[1],16);
    var rhtVal = parseInt(allSec[3]);
    var lftVal = countBin(getVal(b, allSec[1],"bin"));
    var curOps = allSec[2] === "=" ? "===" : allSec[2];
    var result = eval( lftVal + " " + curOps + " " + rhtVal);
    return [true, result];
}

function processBVAL(allSec, b) {
    var val = getVal(b, allSec[1], "bin", true);
    var num = parseInt(allSec[2]) - 1;
    console.log(num + " " + val[num]);
    return [true, val[num] === '1'];
}
 
function runBitWiseCount(b1, op, b2) {
    //zfill to max
    if( b1.length > b2.length)
        b2 = b2.padStart( b1.length, '0' );
    else if( b1.length < b2.length )
        b1 = b1.padStart( b2.length, '0' );
    result = []
    for(var i = 0; i < b1.length; i++) {
        if(op === "AND")
            result.push( b1[i] === '1' && b2[i] === '1' ? 1 : 0  );
        else if(op === "OR")
            result.push( b1[i] === '1' || b2[i] === '1' ? 1 : 0  );
        else if(op === "XOR")
            result.push( ((b1[i] === '1' && b2[i] === '0') || (b1[i] === '0' && b2[i] === '1')) ? 1 : 0 );
    }
    return countBin(result.join(''));
}
 
function processStatement(stmt, b, Ops) {
    var mode = stmt.indexOf('|') === -1 ? '&' : '|';
    var stmts = stmt.split(mode);
    var results = [];
    stmts.map( (cStmt) => {
        var chk = checkStatement(cStmt, Ops);
        if(!chk)
            results.push(chk);
        var allSec = cStmt.split(',');
        var opCode = allSec[0];
        if( opCode === "CMP") {
            results.push(processCMP(allSec, b));
        }
        else if( opCode === "BCMP") {
            results.push(processBCMP(allSec, b));
        }
        else if( opCode === "BWCMP") {
            results.push(processBWCMP(allSec, b));
        }
        else if( opCode === "BVAL") {
            results.push(processBVAL(allSec, b));
        }
        else
            results.push([false, "Error with statement"]);
    });
    if(mode === '&') {
        for(var i = 0; i < results.length; i++) {
            if(!results[i][1])
                return false;
        }
        return true;
    }
    else if(mode === '|') {
        for(var i = 0; i < results.length; i++) {
            if(results[i][1])
                return true;
        }
        return false;
    }
}
 
function isHex(val) {
    var hex = "0123456789abcdefABCDEF-";
    return [...val].every( (curChar) => hex.search(curChar) !== -1 );
}
 
function isOp(val) {
    var allOps = ['=', '>', '<', '>=', '<='];
    return (allOps.indexOf(val) !== -1 );
}
 
 
function isBitOp(val) {
    var allOps = ['AND','OR','XOR'];
    return (allOps.indexOf(val) !== -1 );
}
 
function isBin(val) {
    var digit = '01';
    return [...val].every( (curChar) => digit.search(curChar) !== -1 );
}
 
function isDigit(val) {
    var digit = '0123456789';
    return [...val].every( (curChar) => digit.search(curChar) !== -1 );
}
 
function checkType(curType, val) {
    if(curType === 'ADDR' || curType === 'HEX') {
        if(isHex(val))
            return [true, null];
        else
            return [false, "ADDR should be hex"];
    }
    else if(curType === "OP" || curType === "LOP") {
        if(isOp(val))
            return [true, null];
        else
            return [false, "OP should be = > < >= or <="];
    }
    else if(curType === "NUM" || curType === "LNUM") {
        if(isDigit(val))
            return [true, null];
        else
            return [false, "NUM should be digit"];
    }
    else if(curType === "BIN") {
        if(isBin(val))
            return [true, null];
        else
            return [false, "BIN should be binary"];
    }
    else if(curType === "BITOP") {
        if(isBitOp(val))
            return [true, null];
        else
            return [flase, "BITOP should be XOR, OR, or AND"];
    }
    else {
        return [true, null];
    }
}
 
function checkStatement(stmt, allOps) {
    var allSec = stmt.split(',');
    var curOpCode = allSec[0];
    var curOp = allOps.find( (e) => {return e.opCode === curOpCode });
    if( curOp === undefined  )
        return [false, "OP doesn't exist error"];
    if( allSec.length !== curOp.opList.length)
        return [false, "Statement is of wrong length"];
   
    for(var i = 0; i < allSec.length; i++) {
        var val = allSec[i];
        var type = curOp.opList[i];
        var chk = checkType(type,val);
        if(!chk[0])
            return chk;
    }
    return [true,"Success"];
};
 
function readFile() {
    return fs.readFileSync('mem.bin', 'binary');
}

//e.g. Is Pokemon caught
//BVAL,DE99-DEB8,244 (Raiku)

var processQuery = function(cardObj, curResults) {
    var b = readFile();
    var cmpOp = { opCode : "CMP", opList : ['CMP','ADDR','OP','HEX'] };
    var bcmpOp = { opCode : "BCMP", opList : ['BCMP','ADDR', 'OP','NUM']};
    var bwcmpOp = { opCode : "BWCMP", opList : ['BWCMP','ADDR', 'BITOP', 'BIN', 'OP', 'NUM']};
    var lcmpOp= { opCode : "LCMP", opList : ['LCMP', 'ADDR', 'ADDR', 'LIST', 'OP', 'NUM']};
    var bvalOp = { opCode : "BVAL", opList : ['BVAL', 'ADDR', 'NUM']};
    var allOps = [cmpOp, bcmpOp, bwcmpOp, bvalOp];
    var newResults = '';
    for(var j = 0; j < 25; j++) {
        if(curResults[j] === '0') {
            var curSquare = cardObj.squares[j];
            var query = curSquare.query;
            var s = processStatement(query, b, allOps);
            newResults += s ? '1' : '0';
        }
        else
            newResults += '1';
    }
    return newResults;
}

module.exports = processQuery;

// compOp = Op('CMP', ['CMP','ADDR','OP','HEX'])
// listOp = Op('LCMP', ['LCMP','LADDR','LOP','LNUM','OP','NUM'])
// binOp = Op('BCMP', ['BCMP','ADDR','OP','NUM'])
 
// var cmpOp = { opCode : "CMP", opList : ['CMP','ADDR','OP','HEX'] };
// var bcmpOp = { opCode : "BCMP", opList : ['BCMP','ADDR', 'OP','NUM']};
// var bwcmpOp = { opCode : "BWCMP", opList : ['BWCMP','ADDR', 'BITOP', 'BIN', 'OP', 'NUM']};
// var lcmpOp= { opCode : "LCMP", opList : ['LCMP', 'ADDR', 'ADDR', 'LIST', 'OP', 'NUM']};
// var bvalOp = { opCode : "BVAL", opList : ['BVAL', 'ADDR', 'NUM']};
// allOps = [cmpOp, bcmpOp, bwcmpOp];
// var tstA = "CMP,00-02,<=,2F";
// var tstB = "BCMP,00-FF,>=,3";
// var tstC = "BWCMP,00-FF,OR,10100100,>=,1";
// var tstAB = tstC + "&" + tstB + "&" + tstA;
// var b = readFile();
// //var s = checkStatement(tstA, allOps);
// var s = processStatement(tstAB, b, allOps);
// console.log(s);
 
 
 
// function createWindow () {
//   let win = new BrowserWindow({ width: 800, height: 600 });
//   win.setMenu(null);
//   win.loadFile('index.html');
// }
 
// app.on('ready', createWindow)