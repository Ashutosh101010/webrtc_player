let ws;
let lastMessageTimestamp;
const checkInterval = 3000; // 5 seconds
const intervalRepeat = 2000; // 5 seconds
let checkConnectionInterval;
let websocketUrl='';
let userId=0;
let connected=false;

function startWebSocket(url) {
    console.log('startwebsocket')
    ws = new WebSocket(url);
    ws.onopen = function() {
        console.log('WebSocket connection opened');
        lastMessageTimestamp = Date.now();
        stopCheckingConnection();
        startCheckingConnection();
        connected=true;
    };

    ws.onmessage = function(message) {
        handleWebsocketMessage(message)
        // postMessage(message.data);
        lastMessageTimestamp = Date.now();
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
        // stopCheckingConnection();
        // reconnectWebSocket();
        connected=false;
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        // stopCheckingConnection();
        // reconnectWebSocket();
        connected=false;
    };
}

function reconnectWebSocket() {
    console.log('Reconnecting WebSocket...');
    setTimeout(startWebSocket(websocketUrl), 1000); // Wait 1 second before reconnecting
}

function startCheckingConnection() {
    checkConnectionInterval = setInterval(() => {
        console.log('interval')
        if (Date.now() - lastMessageTimestamp > checkInterval) {
            console.log('No message received in the last 5 seconds. Reconnecting...');
            ws.close();
            // startWebSocket(websocketUrl);
            updateWebsocketError(true);
        }else{

            updateWebsocketError(false);
        }
        if(connected==false)
        {
           reconnectWebSocket();
        }
    }, checkInterval);
}

function stopCheckingConnection() {
    console.log('stop checking')
    clearInterval(checkConnectionInterval);
}

function updateWebsocketError(errorBoolean)
{
    let object={};
    object.type='websocketError'
    object.data=errorBoolean;
    postMessage(object);
}
function handleWebsocketMessage(message)
{

    const data = JSON.parse(message.data);
    var object={};
    object.type="websocketMessage";
    object.data=data;
    postMessage(object);

}

onmessage = function(event) {
    let object=event.data;
    console.log(event);

        try {
            if (object.type === 'start') {
                startWebSocket(object.data);
                websocketUrl=object.data;
            }
            if (object.type === 'send' && connected) {
                ws.send(object.data);
            }
            if (object.type === 'meta') {
                userId = object.userId;
            }

        } catch (error) {
            console.log(error);
        }

};
