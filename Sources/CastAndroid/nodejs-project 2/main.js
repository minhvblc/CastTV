
const NativeBridge = process._linkedBinding('SwiftBridge');

import { AndroidRemote } from "./androidtv-remote/index.js";


var androidRemote;

NativeBridge.doSomethingUseful((msg, cb) => {
    function callback(info) {
        cb(info);
    }
    
    switch (msg.type) {
        case 'pair':

            var options;

            if (msg.cert != null) {
                options = {
                    pairing_port : 6467,
                    remote_port : 6466,
                    name : 'androidtv-remote',
                    cert: {
                        cert: msg.cert.replace(/aaaa/g, "\n"),
                        key: msg.key.replace(/aaaa/g, "\n")
                    }
                }
                console.log(options);
            } else {
                options = {
                    pairing_port : 6467,
                    remote_port : 6466,
                    name : 'androidtv-remote',
                }
            }
            

            androidRemote = new AndroidRemote(msg.host, options);

            androidRemote.on('secret', () => {
                console.log('please input pin code');
                callback({
                    "type": "secret"
                });
            });

            androidRemote.on('error', (error) => {
                console.error("AAError : " + error);
                callback({
                    "type": "error"
                });
            });

            androidRemote.on('failed', () => {
                callback({
                    "type": "error"
                });
            });

            androidRemote.on('ready', async () => {

                let cert = androidRemote.getCertificate();

                console.log(cert);

                let host = androidRemote.getHost();

                console.log(host);

                callback({
                    "type": "paired",
                    "host": msg.host,
                    "cert": {
                        "cert": cert.cert.replace(/\r/g, "").replace(/\n/g, "aaaa"),
                        "key": cert.key.replace(/\r/g, "").replace(/\n/g, "aaaa")
                    }
                });
            });

            androidRemote.start();

            break;
        case 'sendCode':
            if (androidRemote != null) {
                androidRemote.sendCode(msg.code);
            }
            break;
        case 'cancelCode':
            if (androidRemote != null) {
                androidRemote.cancelCode();
            }
            break;
        case 'keyPress':
            if (androidRemote != null) {
                androidRemote.sendKey(parseInt(msg.keyCode), parseInt(msg.direction));
            }
            break;
        case 'launchApp':
            if (androidRemote != null) {
                androidRemote.sendAppLink(msg.appLink);
            }
            break;
        case 'disconnect':
            if (androidRemote != null) {
                androidRemote.stop();
                androidRemote = null;
            }
            break;
        default:
            console.log('unknown message: ' + msg.type);
            break;
    }
});

