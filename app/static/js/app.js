"use strict";

const socket = io();
let connected = false;
let keystrokeId = 0;
const processingQueue = [];

function onSocketConnect() {
  connected = true;
  document.getElementById('status-connected').style.display = 'inline-block';
  document.getElementById('status-disconnected').style.display = 'none';
  document.getElementById('instructions').style.visibility = 'visible';
  document.getElementById('disconnect-reason').style.visibility = 'hidden';
}

function onSocketDisconnect(reason) {
  connected = false;
  document.getElementById('status-connected').style.display = 'none';
  document.getElementById('status-disconnected').style.display = 'inline-block';
  document.getElementById('disconnect-reason').style.visibility = 'visible';
  document.getElementById('disconnect-reason').innerText = 'Error: ' + reason;
  document.getElementById('instructions').style.visibility = 'hidden';
}

function limitRecentKeys(limit) {
  const recentKeysDiv = document.getElementById('recent-keys');
  while (recentKeysDiv.childElementCount > limit) {
    recentKeysDiv.removeChild(recentKeysDiv.firstChild);
  }
}

function addKeyCard(key, keystrokeId) {
  const card = document.createElement('div');
  card.classList.add('key-card');
  if (key === ' ') {
    card.innerHTML = '&nbsp;';
  } else {
    card.innerText = key;
  }
  card.setAttribute('keystroke-id', keystrokeId);
  document.getElementById('recent-keys').appendChild(card);
  limitRecentKeys(10);
}

function updateKeyStatus(keystrokeId, success) {
  const recentKeysDiv = document.getElementById('recent-keys');
  const cards = recentKeysDiv.children;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (parseInt(card.getAttribute('keystroke-id')) === keystrokeId) {
      if (success) {
        card.classList.add('processed-key-card');
      } else {
        card.classList.add('unsupported-key-card');
      }
      return;
    }
  }
}

function onKeyDown(evt) {
  if (!connected) {
    return;
  }
  if (!evt.metaKey) {
    evt.preventDefault();
    addKeyCard(evt.key, keystrokeId);
    processingQueue.push(keystrokeId);
    keystrokeId++;
  }

  let location = null;
  if (evt.location === 1) {
    location = 'left';
  } else if (evt.location === 2) {
    location = 'right';
  }
  
  socket.emit('keystroke', {
    metaKey: evt.metaKey,
    altKey: evt.altKey,
    shiftKey: evt.shiftKey,
    ctrlKey: evt.ctrlKey,
    key: evt.key,
    keyCode: evt.keyCode,
    location: location,
  });
}

function onDisplayHistoryChanged(evt) {
  if (evt.target.checked) {
    document.getElementById('recent-keys').style.visibility = 'visible';
  } else {
    document.getElementById('recent-keys').style.visibility = 'hidden';
    limitRecentKeys(0);
  }
}

var codeMap = {"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"d":68,"b":66,"a":65,"s":83,"i":73,"f":70,"k":75,"ß":219,"Dead":220,"+":187,"ü":186,"p":80,"o":79,"u":85,"z":90,"t":84,"r":82,"e":69,"w":87,"g":71,"h":72,"j":74,"l":76,"ö":192,"ä":222,"#":191,"y":89,"x":88,"c":67,"v":86,"n":78,"m":77,",":188,".":190,"-":189,"ArrowRight":39,"ArrowLeft":37,"ArrowUp":38,"ArrowDown":40,"PageDown":34,"Clear":12,"Home":36,"PageUp":33,"End":35,"Delete":46,"Insert":45,"Control":17,"AltGraph":18,"Meta":92,"Alt":18,"Shift":16,"CapsLock":20,"Tab":9,"Escape":27,"F1":112,"F2":113,";":188,":":190,"_":189,"'":191,"*":187,"Q":81,"W":87,"E":69,"R":82,"T":84,"Z":90,"S":83,"A":65,"D":68,"I":73,"U":85,"O":79,"Y":89,"X":88,"C":67,"F":70,"V":86,"G":71,"B":66,"H":72,"N":78,"J":74,"M":77,"K":75,"L":76,"P":80,"Ö":192,"Ä":222,"Ü":186,"!":49,"\"":50,"§":51,"$":52,"%":53,"&":54,"/":55,"(":56,")":57,"=":48,"?":219,"°":220};

function simulateKey(char) {
  const keyEvent = new KeyboardEvent('keydown', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      charCode: char.charCodeAt(0),
      keyCode: codeMap[char],
      which: char.charCodeAt(0),
      bubbles: true,
      cancelable: true,
      shiftKey: char === char.toUpperCase(),
  });

  onKeyDown(keyEvent);
}

function handlePastedText(text) {
  text.split('').forEach((char, index) => {
    setTimeout(() => {
      simulateKey(char);
    }, index * 200);
  });
}



document.querySelector('body').addEventListener("keydown", onKeyDown);
document.getElementById('display-history-checkbox').addEventListener("change", onDisplayHistoryChanged);
document.getElementById('pasteArea').addEventListener('paste', function(event) {
  let pastedText = (event.clipboardData || window.clipboardData).getData('text');
  handlePastedText(pastedText);
});
socket.on('connect', onSocketConnect);
socket.on('disconnect', onSocketDisconnect);
socket.on('keystroke-received', (data) => {
  updateKeyStatus(processingQueue.shift(), data.success);
});