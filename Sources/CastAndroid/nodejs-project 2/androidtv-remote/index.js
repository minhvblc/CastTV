import {CertificateGenerator} from "./certificate/CertificateGenerator.js"
import {PairingManager} from "./pairing/PairingManager.js"
import {RemoteManager} from "./remote/RemoteManager.js";
import {remoteMessageManager} from "./remote/RemoteMessageManager.js";
import EventEmitter from "events";

export class AndroidRemote extends EventEmitter {
    constructor(host, options)
    {
        super();
        this.host = host
        if (options.cert != null) {
            this.cert = {
                key:options.cert.key,
                cert:options.cert.cert,
            }
        } else {
            this.cert = {
                key: null,
                cert: null,
            }
        }
        
        this.pairing_port = options.pairing_port?options.pairing_port:6467;
        this.remote_port = options.remote_port?options.remote_port:6466;
        this.service_name = options.service_name?options.service_name:"Service Name";
    }

    async start() {

        if (!this.cert.key || !this.cert.cert) {
            this.cert = CertificateGenerator.generateFull(
                this.service_name,
                'CNT',
                'ST',
                'LOC',
                'O',
                'OU'
            );

            this.pairingManager = new PairingManager(this.host, this.pairing_port, this.cert, this.service_name)
            this.pairingManager.on('secret', () => this.emit('secret'));

            let paired = await this.pairingManager.start().catch((error) => {
                console.error(error);
            });

            if (!paired) {
                this.emit('failed');
                return;
            }
        }

        this.remoteManager = new RemoteManager(this.host, this.remote_port, this.cert);

        this.remoteManager.on('powered', (powered) => this.emit('powered', powered));

        this.remoteManager.on('volume', (volume) => this.emit('volume', volume));

        this.remoteManager.on('current_app', (current_app) => this.emit('current_app', current_app));

        this.remoteManager.on('ready', () => this.emit('ready'));

        this.remoteManager.on('unpaired', () => this.emit('unpaired'));

        this.remoteManager.on('failed', () => this.emit('failed'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        let started = await this.remoteManager.start().catch((error) => {
            console.error(error);
        });

        return started;
    }

    sendCode(code){
        return this.pairingManager.sendCode(code);
    }

    cancelCode() {
        this.pairingManager.cancelCode();
    }

    sendPower(){
        return this.remoteManager.sendPower();
    }

    sendAppLink(app_link){
        return this.remoteManager.sendAppLink(app_link);
    }

    sendKey(key, direction){
        return this.remoteManager.sendKey(key, direction);
    }

    getCertificate(){
        return {
            key:this.cert.key,
            cert:this.cert.cert,
        }
    }

    getHost() {
        return this.host;
    }

    stop() {
        if (this.remoteManager != null) {
            this.remoteManager.stop();
        }
        if (this.pairingManager != null) {
            this.pairingManager.stop();
        }
    }
}


let RemoteKeyCode = remoteMessageManager.RemoteKeyCode;
let RemoteDirection = remoteMessageManager.RemoteDirection;
export {
    RemoteKeyCode,
    RemoteDirection,
}
export default {
    AndroidRemote,
    CertificateGenerator,
    RemoteKeyCode,
    RemoteDirection,
}

