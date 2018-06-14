import {app} from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pm2 from 'pm2';
import fetch from 'node-fetch';
import electrumServers from './config/electrum';
import tokenconfig from './config/tokenconfig';

const numcoin = 100000000;
const txfee = 10000;

function exists(pathToCheck) {
    try {
        fs.accessSync(pathToCheck);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Experimental client collection wrapper.
 *
 * @class
 */
export default class Marketmaker {

    /**
     * @param {Object} log              - Winston lvogger
     * @param {Object} appSettings      - settings.json object
     * @param {Object} eventsBus        - event emitter for listening or emitting events on the
     *                                    desktop side
     * @param {PluginSettings} settings - plugin settings
     * @param {Object} modules          - references to all loaded modules
     * * @param {Object} Module         - reference to Module class
     */
    constructor({log, appSettings, eventsBus, settings, modules, Module}) {
        this.module = new Module('marketmaker');

        this.modules = modules;
        this.settings = settings;
        // Get the automatically predefined logger instance.
        this.log = log;
        this.eventsBus = eventsBus;

        this.eventsBus.on('desktopLoaded', () => {
            this.init();
        });

        this.collections = {};

        this.process = null;

        this.Tradedata = null;
        this.Userdata = null;
        this.Swapdata = null;
        this.Transactions = null;

        app.on('will-quit', (e) => {
            console.log('will quit');
            if (this.process) {
                e.preventDefault();
                pm2.stop('mm', (err) => {
                    if (err) {
                        this.log.error(err);
                    }
                    app.exit(0);
                });
            }
        });
    }

    encodeWinParams(param = '') {
        let result = '';

        if (param !== '' &&
            (
                !~param.indexOf(' ') &&
                !~param.indexOf('\t') &&
                !~param.indexOf('\n') &&
                !~param.indexOf('\v') &&
                !~param.indexOf('"')
            ))
        {
            return param;
        } else {
            //result = '"';

            for (let i = 0; i < param.length; i++) {
                let numberBackslashes = 0;

                while (i < param.length && param[i] === '\\') {
                    i++;
                    numberBackslashes++;
                }

                if (i === param.length-1) {

                    //
                    // Escape all backslashes, but let the terminating
                    // double quotation mark we add below be interpreted
                    // as a metacharacter.
                    //

                    result += '\\'.repeat(numberBackslashes * 2);
                    break;
                }
                else if (param[i] === '"') {

                    //
                    // Escape all backslashes and the following
                    // double quotation mark.
                    //

                    result += '\\'.repeat((numberBackslashes * 2) + 1);
                    result += param[i];
                }
                else {

                    //
                    // Backslashes aren't special here.
                    //

                    result += '\\'.repeat(numberBackslashes);
                    result += param[i];
                }
            }

            //result += '"';
            return result;
        }

    }

    init() {
        // Do some initialization if necessary.
        this.registerApi();

        // Lets inform that the module has finished loading.
        this.eventsBus.emit('marketmaker.loaded');
    }

    registerApi() {
        this.module.on('startWallet', this.startWallet.bind(this));
        this.module.on('stopWallet', this.stopWallet.bind(this));
        this.module.on('sendToAddress', this.sendToAddress.bind(this));
        this.module.on('listUnspent', this.listUnspent.bind(this));
        this.module.on('buy', this.buy.bind(this));
    }

    async startWallet(event, fetchId, pass) {
        const collections = this.modules.collections;
        this.Tradedata = collections.getCollection('tradeData');
        this.Userdata = collections.getCollection('userData');
        this.Swapdata = collections.getCollection('swapData');
        this.Transactions = collections.getCollection('transactions');

        await this.Tradedata.remove({});
        await this.Userdata.remove({});

        if (await this.Tradedata.count() < 1) {
            await this.Tradedata.insert({
                key: "priceKMD",
                price: Number(0) * numcoin,
                createdAt: new Date()
            });
            // await this.Tradedata.insert({
            //     key: "eqlpriceLTC",
            //     price: Number(0) * numcoin,
            //     createdAt: new Date()
            // });
            await this.Tradedata.insert({
                key: "priceLTC",
                price: Number(0) * numcoin,
                createdAt: new Date()
            });
        }

        if (await this.Userdata.count() === 0) {
            const data = [
                // {
                //     coin: "LTC",
                //     balance: Number(0) * numcoin,
                //     smartaddress: "addr",
                //     createdAt: new Date()
                // },
                {
                    coin: "KMD",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                },
                {
                    coin: tokenconfig.dICOtoken.shortcode,
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                },
                {
                    coin: "LTC",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                },
            ];

            await Promise.all(data.map(coin => this.Userdata.insert(coin)));
        }

        const coinFile = path.join(__dirname, '../../assets/config/coins.json');
        const coindata = JSON.parse(fs.readFileSync(coinFile, 'utf8'));

        let marketmakerBin;
        const marketmakerDir = path.join(app.getPath('userData'), 'marketmaker');

        if (os.platform() === 'darwin') {
            marketmakerBin = path.join(this.settings.extractedFilesPath, 'marketmaker');
        }
        else if (os.platform() === 'linux') {
            marketmakerBin = path.join(this.settings.extractedFilesPath, 'marketmakerlinux');
            // marketmakerBin = Meteor.rootPath + '/../../../../../private/static/LINUX/marketmaker',
            // marketmakerDir = `${process.env.HOME}/.marketmaker`;
        }
        else if (os.platform() === 'win32') {
            marketmakerBin = path.join(this.settings.extractedFilesPath, 'marketmaker.exe');
        }
        else {
            this.module.respond('startWallet', fetchId, [false, 'Unknown platform']);
            return false;
        }

        console.log(marketmakerBin);
        this.log.info(marketmakerBin);


        console.log("starting MM...")
        const startparams = {
            'gui': 'dICOapp',
            'client': 1,
            'canbind': 0,
            'userhome': `${process.env.HOME}`,
            'passphrase': "default",
            'coins': coindata
        };

        let params = JSON.stringify(startparams);
        let home = process.env.HOME;

        if (os.platform() !== 'win32') {
            params = `'${params}'`;
        } else {
            //check coins pass via mm argv

            //params = params.replace(/"/g, '\\"');
            //params = `"${params}"`;

            params = `'${params}'`;
        }

        if (!exists(marketmakerDir)) {
            fs.mkdirSync(marketmakerDir);
        }

        pm2.connect(true, (err) => { //start up pm2 god
            if (err) {
                this.module.respond('startWallet', fetchId, false);
                console.error(err);
                process.exit(2);
            }

            try {
                pm2.start({
                    script: marketmakerBin,         // path to MM binary
                    exec_mode: 'fork',
                    cwd: marketmakerDir, //set correct working dir for MM data
                    args: params,  //stringified params,
                    name: 'mm',
                    exec_interpreter: 'none',
                }, async (err, app) => {
                    if (err) {
                        this.module.respond('startWallet', fetchId, [false, err.toString()]);
                        return;
                    }
                    //console.log('err', err, 'app', app);
                    this.process = app;
                    /*pm2.launchBus((err, bus) => {
                        bus.on('log:out', data => {
                            try {
                                console.log('log', data.data);
                            } catch (e) {
                                // no harm, meteor app is not ready yet
                            }
                        });
                    });*/
                    pm2.disconnect();   // Disconnect from PM2
                    console.log("started MM ");
                    setTimeout(async () => {
                        try {
                            await this.login(pass);
                            await this.addServers();
                            await this.getBalances();
                            this.module.respond('startWallet', fetchId, [true]);
                        } catch (e) {
                            this.module.respond('startWallet', fetchId, [false, e.toString()]);
                        }
                    }, 2000);
                });
            } catch (e) {
                console.log('main try catch', e);
                this.module.respond('startWallet', fetchId, [false, e.toString()]);
            }

        });

    }

    async buy(event, fetchId, amount, paycoin) {
        var unspent = await this.listUnspent(undefined, undefined, paycoin);
        const userpass = (await this.Userdata.findOne({key: "userpass"})).userpass;

        if (Number(unspent.length) < 2) {

            const getprices = {
                'userpass': userpass,
                'method': 'orderbook',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin
            }
            var bestprice = 0;
            try {
                const result = await this.fetch(getprices, undefined, 90000);
                //bestprice = Number((JSON.parse(result.content).asks[0].price*100000000).toFixed(0));
                const resultJson = await result.json();
                console.log(resultJson.asks.length);
                try {
                    if (resultJson.asks.length > 0) {
                        var i = 0;
                        while (i < resultJson.asks.length && resultJson.asks[i].maxvolume === 0) {
                          i++;
                        }
                        if(resultJson.asks[i].maxvolume > 0){
                          bestprice = Number((resultJson.asks[i].price * 100000000).toFixed(0));
                        }
                        console.log("best price: " + bestprice);
                    }
                } catch (e) {
                    console.log(e);
                    this.module.respond('buy', fetchId, [false, e.toString()]);
                    return;
                }
            } catch (e) {
                this.module.respond('buy', fetchId, [false, e.toString()]);
                return;
            }
            var buf = 1.08 * numcoin;
            var bufprice = Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * numcoin).toFixed(0));
            var relvolume = Number(amount / numcoin * bestprice / numcoin);
            var buyparams = null;
            if (relvolume * numcoin + txfee < Number((await this.Userdata.findOne({coin: paycoin})).balance)) {
                buyparams = {
                    'userpass': userpass,
                    'method': 'buy',
                    'base': tokenconfig.dICOtoken.shortcode,
                    'rel': paycoin,
                    'relvolume': relvolume.toFixed(8),
                    'price': Number(bufprice / numcoin).toFixed(8)
                }
            }
            else {
                this.module.respond('buy', fetchId, [false, 'Not enough balance!']);
                return;
            }
            try {
                const result = await this.fetch(buyparams, undefined, 90000);
                console.log("You are spending: " + relvolume.toFixed(8) + " KMD for " + Number(bufprice / numcoin).toFixed(8) + "KMD each and resulting in " + relvolume.toFixed(8) / Number(bufprice / numcoin).toFixed(8) + tokenconfig.dICOtoken.shortcode);
                const resultText = await result.text();
                console.log("buy call response1: " + JSON.parse(resultText));
                console.log("UTXO autosplit TX INFO: " + resultText);
            } catch (e) {
                this.module.respond('buy', fetchId, [false, e.toString()]);
                return;
            }
            this.module.respond('buy', fetchId, [true, "Funds in preparation"]);
            return;
        }
        // else{
        const getprices = {
            'userpass': userpass,
            'method': 'orderbook',
            'base': tokenconfig.dICOtoken.shortcode,
            'rel': paycoin
        }
        var bestprice = 0;
        try {
            const result = await this.fetch(getprices, undefined, 90000);
            //bestprice = Number((JSON.parse(result.content).asks[0].price*100000000).toFixed(0));
            const resultText = await result.text();
            const resultJson = JSON.parse(resultText);
            console.log(resultJson.asks.length);
            console.log(resultText);
            try {
                if (resultJson.asks.length > 0) {
                    var i = 0;
                    while (i < resultJson.asks.length && resultJson.asks[i].maxvolume === 0) {
                      i++;
                    }
                    if(resultJson.asks[i].maxvolume > 0){
                      bestprice = Number((resultJson.asks[i].price * 100000000).toFixed(0));
                    }
                    console.log("best price: " + bestprice);
                }
            } catch (e) {
                console.log(e);
                this.module.respond('buy', fetchId, [false, e.toString()]);
                return;
            }
        } catch (e) {
            console.log("err2. " + e);
            this.module.respond('buy', fetchId, [false, e.toString()]);
            return;
        }
        var buf = 1.08 * numcoin;
        var bufprice = Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * numcoin).toFixed(0));
        var relvolume = Number(amount / numcoin * bestprice / numcoin);
        // console.log("amount: " + amount / numcoin);
        // console.log("bestprice: " + bestprice / numcoin);
        // console.log("relvolume: " + relvolume);
        var buyparams = null;
        if (relvolume * numcoin + txfee < Number((await this.Userdata.findOne({coin: paycoin})).balance)) {
            buyparams = {
                'userpass': userpass,
                'method': 'buy',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin,
                'relvolume': relvolume.toFixed(8),
                'price': Number(bufprice / numcoin).toFixed(8)
            }
        }
        else {
            this.module.respond('buy', fetchId, [false, "Not enough balance!"]);
            return;
        }
        if (!(await this.Tradedata.findOne({key: "tempswap"})) && bestprice > 0) {
            try {
                const result = await this.fetch(buyparams, undefined, 90000);
                //console.log("You are spending: " + relvolume.toFixed(3) + " KMD for " + Number(bufprice / numcoin).toFixed(3) + "KMD each and resulting in " + relvolume.toFixed(3) / Number(bufprice / numcoin).toFixed(3) + "BNTN");
                const resultText = await result.text();
                const resultJson = JSON.parse(resultText);
                if (resultText.substr(2, 5) === "error") {
                    this.module.respond('buy', fetchId, [false, resultJson.error]);
                    return;
                }

                //console.log("buy call response1: ", resultJson);

                var alice = resultJson.pending.aliceid.toString();
                var uuid = resultJson.pending.uuid;
                try {
                    await this.Tradedata.insert({
                        key: "tempswap",
                        tradeid: resultJson.pending.tradeid,
                        aliceid: alice.substr(0,8),
                        uuid: uuid,
                        paycoin: paycoin,
                        expiration: resultJson.pending.expiration,
                        createdAt: new Date()
                    });

                    await this.Swapdata.insert({
                        tradeid: resultJson.pending.tradeid,
                        expiration: resultJson.pending.expiration,
                        requestid: 0,
                        quoteid: 0,
                        value: amount / numcoin,
                        aliceid: alice.substr(0, 8),
                        uuid: uuid,
                        status: "pending",
                        finished: false,
                        paycoin: paycoin,
                        price: Number(bufprice / numcoin).toFixed(8),
                        bobdeposit: 0,
                        alicepayment: 0,
                        bobpayment: "0000000000000000000000000000000000000000000000000000000000000000",
                        paymentspent: 0,
                        Apaymentspent: "0000000000000000000000000000000000000000000000000000000000000000",
                        depositspent: 0,
                        sorttime: 0,
                        timedout: false,
                        step: 0,
                        swaplist: false,
                        finishtime: new Date().toGMTString(),
                        createdAt: new Date()
                    });
                } catch (e) {
                    this.module.respond('buy', fetchId, [false, e.toString()]);
                    return;
                }

                this.module.respond('buy', fetchId, [true, "Swap initiated - please wait min. 3 minutes before buying again!"]);
                return;

            } catch (e) {
                console.log(e);
                this.module.respond('buy', fetchId, [false, e.toString()]);
                return;
            }
        } else if (bestprice == 0) {
            this.module.respond('buy', fetchId, [false, "Orderbook is not synced. Please wait a few minutes."]);
            return;
        } else {
            this.module.respond('buy', fetchId, [false, "Already swap ongoing - please wait until finished."]);
            return;
        }
        // }
    }

    async listUnspent(event, fetchId, coin) {

        const user = await this.Userdata.findOne({key: "userpass"});
        const coinentry = await this.Userdata.findOne({coin: coin});
        //console.log('coinEntry', coinentry);
        const listunspentparams = {
            'userpass': user.userpass,
            'method': 'listunspent',
            'coin': coin,
            'address': coinentry.smartaddress.toString() //hardcoded for now
        };

        try {
            const result = await this.fetch(listunspentparams);
            var utxos = await result.json();
            //console.log('unspent', utxos);
            if (event) {
                this.module.respond('listUnspent', fetchId, [true, utxos]);
            } else {
                return utxos;
            }
        } catch (e) {
            if (event) {
                this.module.respond('listUnspent', fetchId, [false, e.toString()]);
            } else {
                return false;
            }
        }
    }

    async getBalances() {
        if (await this.Userdata.count() > 4) {
            await this.getBalance(tokenconfig.dICOtoken.shortcode);
            await this.getBalance('KMD');
            await this.getBalance('LTC');
            //await this.getBalance('LTC');
            await this.getPrice('KMD');
            await this.getPrice('LTC');
            //await this.getPrice('LTC');
        }
        //console.log("connected");
    }

    async stopWallet(event, fetchId) {
        const stopparams = {
            'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass.toString(),
            'method': 'stop'
        };

        await this.Tradedata.remove({});
        await this.Userdata.remove({});
        await this.Transactions.remove({});
        await this.Swapdata.remove({}); //clean swapdata

        try {
            const result = await this.fetch(stopparams);

            console.log(await result.json());

            pm2.connect((err) => {
                if (err) {
                    console.error(err);
                    this.module.respond('stopWallet', fetchId, [false, 'Could not connect to daemon']);
                }
            });

            try {
                pm2.stop("mm", (err, apps) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        //console.log("stopped MM");
                        pm2.disconnect();
                        this.module.respond('stopWallet', fetchId, [true]);
                    }
                });
            } catch (e) {
                console.log(e);
                this.module.respond('stopWallet', fetchId, [false, e.toString()]);
            }
        } catch (e) {
            this.module.respond('stopWallet', fetchId, [false, e.toString()]);
        }
    }

    async getBalance(coin) {
        const balanceparams = {
            'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass,
            'method': 'balance',
            'coin': coin,
            'address': (await this.Userdata.findOne({coin: coin})).smartaddress.toString()
        };

        try {
            const result = await this.fetch(balanceparams);
            const resultJson = await result.json();
            try {
                await this.Userdata.update({coin: coin}, {$set: {balance: (Number(resultJson.balance) * numcoin)}});
                console.log(coin + " " + resultJson.balance)
            } catch (e) {
                throw e;
            }
        } catch (e) {
            throw e;
        }
    }

    fetch(data, url = 'http://127.0.0.1:7783', timeout) {
        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
        };
        if (timeout) {
            options.timeout = timeout;
        }
        return fetch(url, options)
    }

    async login(passphrase) {
        //console.log(passphrase);

        const setparams = {
            'userpass': '1d8b27b21efabcd96571cd56f91a40fb9aa4cc623d273c63bf9223dc6f8cd81f',
            'userhome': `${process.env.HOME}`,
            'method': 'passphrase',
            'passphrase': passphrase,
            'gui': 'dICOApp',
            // 'netid':
            // 'seednode':
        };
        //console.log("using passphrase: " + passphrase);
        try {
            //console.log("ISSUING login call");
            const result = await this.fetch(setparams);
            //console.log("login result: " + result);
            const content = await result.json();
            //console.log(JSON.stringify(content));
            var userpass = content.userpass;
            //console.log("userpass: " + userpass);

            try {
                //console.log("set pass");
                console.log(content);

                await this.Userdata.insert({
                    key: "userpass",
                    userpass: content.userpass,
                    createdAt: new Date()
                });
                await this.Userdata.insert({
                    key: "mypubkey",
                    mypubkey: content.mypubkey,
                    createdAt: new Date()
                });
                await this.Userdata.insert({
                    key: "pubaddres",
                    mypubkey: content.KMD,
                    createdAt: new Date()
                });


                var coins = content.coins;
                for (var i = 0; i < coins.length; i++) {
                    var coinobj = coins[i];
                    try {
                        await this.Userdata.update({coin: coinobj.coin}, {$set: {smartaddress: coinobj.smartaddress.toString()}});
                    } catch (e) {
                        throw e;
                    }
                }

            } catch (e) {
                console.log('insert/update try catch', e);
                throw e;
            }

        } catch (e) {
            console.log('login try catch', e);
            throw e;
        }

    }

    async addServers() {
        console.log("adding electrum servers");
        const userpass = (await this.Userdata.findOne({key: "userpass"})).userpass.toString();
        const paramsKMD = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': 'KMD',
            'ipaddr': 'electrum1.cipig.net',
            'port': 10001
        };

        const paramsKMD2 = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': 'KMD',
            'ipaddr': electrum2.cipig.net,
            'port': 10001
        };

        const paramsdICOT = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': tokenconfig.dICOtoken.shortcode,
            'ipaddr': electrumServers.dICOtoken.,
            'port': electrumServers.dICOtoken.port
        };

        const paramsdICOT2 = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': tokenconfig.dICOtoken.shortcode,
            'ipaddr': electrumServers.dICOtoken.altserverList[0],
            'port': electrumServers.dICOtoken.port
        };

        // const paramsZEC = {
        //     'userpass': userpass,
        //     'method': 'electrum',
        //     'coin': 'ZEC',
        //     'ipaddr': '46.4.87.18',
        //     'port': 10000
        // };
        //
        // const paramsZEC2 = {
        //     'userpass': userpass,
        //     'method': 'electrum',
        //     'coin': 'ZEC',
        //     'ipaddr': '46.4.78.11',
        //     'port': 10000
        // };

        const paramsLTC = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': 'LTC',
            'ipaddr': 'electrum1.cipig.net',
            'port': 10065
        };

        const paramsLTC2 = {
            'userpass': userpass,
            'method': 'electrum',
            'coin': 'LTC',
            'ipaddr': 'electrum2.cipig.net',
            'port': 10065
        };

        const toSend = [paramsKMD, paramsKMD2, paramsLTC, paramsLTC2 paramsdICOT, paramsdICOT2];

        for (let i = 0; i < toSend.length; i++) {
            try {
                const result = await this.fetch(toSend[i]);
                console.log(await result.text());
            } catch (e) {
                throw e;
            }
        }
    }

    async getPrice(paycoin) {
        if (await this.Userdata.findOne({key: "userpass"})) {
            const getprices = {
                'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass,
                'method': 'orderbook',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin
            }
            var bestprice = 0;
            const buf = 1.08 * numcoin;
            var price = 0;
            try {
                const result = await this.fetch(getprices);
                const resultJson = await result.json();
                try {
                    if (resultJson.asks.length > 0) {
                        var i = 0;
                        while (i < resultJson.asks.length && resultJson.asks[i].maxvolume === 0) {
                          i++;
                        }
                        if(resultJson.asks[i].maxvolume > 0){
                          bestprice = Number((resultJson.asks[i].price * 100000000).toFixed(0));
                        }
                    }
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            } catch (e) {
                throw e;
            }
            try {
                console.log("best price: ", paycoin, bestprice);
                if (bestprice > 0) {
                    await this.Tradedata.update({key: "price" + paycoin}, {$set: {price: Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * 100000000).toFixed(0))}});
                } else {
                    await this.Tradedata.update({key: "price" + paycoin}, {$set: {price: 0}});
                }
            } catch (e) {
                throw e;
            }
        } else {
            console.log("getprice() not ready yet");
        }
    }

    async sendToAddress(event, fetchId, coin, address, amount) {
        console.log(fetchId);
        console.log("payout: "+ amount + coin + " to " + address);
        var outputs = '[{' + address + ':' + Number(amount) / numcoin + '}]';
        console.log(outputs);
        outputs = JSON.stringify(eval("(" + outputs + ")"));
        console.log(outputs);

        const sendparams = {
            'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass,
            'method': 'withdraw',
            'coin': coin,
            'outputs': JSON.parse(outputs)
        };
        let result = null;
        try {
            result = await this.fetch(sendparams);
            result = await result.json();
            console.log("RAWTX: ");
            console.log(result);
        } catch (e) {
            console.log("Error: " + e);
            this.module.respond('sendToAddress', fetchId, [false, e.toString()]);
            return;
        }
        const sendrawtx = {
            'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass,
            'method': 'sendrawtransaction',
            'coin': coin,
            'signedtx': result.hex
        };
        try {
            let result2 = await this.fetch(sendrawtx);
            result2 = await result2.text();
            this.module.respond('sendToAddress', fetchId, [true, result2]);
        } catch (e) {
            console.log(e);
            this.module.respond('sendToAddress', fetchId, [false, e.toString()]);
        }
    }

    async checkSwapStatus(requestid, quoteid) {
        console.log("call checkswapstatus", requestid, quoteid);
        const userpass = (await this.Userdata.findOne({key: "userpass"})).userpass;
        if (userpass) {
            if ((requestid == "" && quoteid == "") || (requestid == null && quoteid == null)) {
                const swaplist = {
                    'userpass': userpass,
                    'method': 'recentswaps'
                };
                try {
                    const result = await this.fetch(swaplist, undefined, 60000);
                    const resultJson = await result.json();
                    console.log("checkswapstatus: ", resultJson);
                    var swaps = resultJson.swaps;
                    const tempSwap = await this.Tradedata.findOne({key: "tempswap"});
                    console.log('tempSwap', tempSwap);
                    if (tempSwap) {
                        if (tempSwap.expiration * 1000 < Date.now()) {
                            await this.Tradedata.remove({key: "tempswap"});
                        }
                    }
                    const cursor = await this.Swapdata.find({swaplist: false});
                    var tswaps = await cursor.fetch();
                    cursor.destroy();
                    console.log('TSWAPS', tswaps);
                    for (var i = 0; i < tswaps.length; i++) {
                        const swapelem = tswaps[i];
                        if (swapelem.expiration * 1000 + 900000 < Date.now()) {
                            try {
                                await this.Swapdata.update(
                                    {
                                        tradeid: swapelem.tradeid,
                                        uuid: swapelem.uuid
                                    }, {
                                        $set: {
                                            status: "timedout",
                                            timedout: true,
                                            finished: true,
                                            Apaymentspent: 1
                                        }
                                });
                            } catch (e) {
                                console.log(e);
                                console.log(e.stack);
                                throw e;
                            }
                        }
                    }

                    for (var i = 0; i < swaps.length; i++) {
                        var swapobj = swaps[i];
                        try {
                            await this.checkSwapStatus(swapobj[0], swapobj[1]);
                        } catch (e) {
                            throw e;
                        }
                    }
                } catch (e) {
                    console.log(e);
                    console.log(e.stack);
                    throw e;
                }
            } else {
                if (quoteid != 0 && requestid != 0) {

                    const swapelem = {
                        'userpass': userpass,
                        'method': 'swapstatus',
                        'requestid': requestid,
                        'quoteid': quoteid
                    };
                    console.log(swapelem);
                    try {
                        const result = await this.fetch(swapelem);
                        var swap = await result.json();
                        console.log("SWAPELEM: ", swap);

                        var alice = swap.aliceid.toString();
                        var uuid = swap.uuid;
                        var step = 0;

                        var bobpayment = swap.bobpayment;
                        console.log("<<<<<<<<<<<<<<<<<<<<<bob: ", bobpayment);

                        const swapFromDb = await this.Swapdata.findOne({uuid: uuid});
                        console.log('swapFromDb', swapFromDb);
                        if (swapFromDb) {
                            console.log("<<<<<<<<<<<<<<<<<<<<found swap");
                            if (swapFromDb.bobpayment == "0000000000000000000000000000000000000000000000000000000000000000") {
                                console.log("bobpayment == 0");
                                try {
                                    if (swapFromDb.bobdeposit != "0000000000000000000000000000000000000000000000000000000000000000" &&
                                        swapFromDb.alicepayment == "0000000000000000000000000000000000000000000000000000000000000000") {
                                        console.log("set step 1");
                                        step = 1;
                                    } else if (swapFromDb.alicepayment != "0000000000000000000000000000000000000000000000000000000000000000") {
                                        console.log("set step 2")
                                        step = 2;
                                    }
                                    console.log(swapFromDb.finishtime);
                                    var matched = 0;
                                    console.log(new Date(swap.finishtime * 1000).toGMTString());

                                    if (swapFromDb.finishtime === "Invalid Date" || new Date(swap.finishtime * 1000).toGMTString() === "Invalid Date") {
                                        console.log("matched");
                                        matched = 1;
                                    }
                                    await this.Swapdata.update({uuid: uuid}, {
                                        $set: {
                                            requestid: swap.requestid,
                                            quoteid: swap.quoteid,
                                            //value: swap.values[0],
                                            status: "pending",
                                            finished: false,
                                            step: step,
                                            aliceid: alice.substr(0, 8),
                                            bobdeposit: swap.bobdeposit,
                                            alicepayment: swap.alicepayment,
                                            bobpayment: swap.bobpayment,
                                            paymentspent: swap.paymentspent,
                                            Apaymentspent: swap.Apaymentspent,
                                            depositspent: swap.depositspent,
                                            swaplist: true,
                                            matched: matched,
                                            finishtime: new Date(swap.finishtime * 1000).toGMTString(),
                                            sorttime: swap.finishtime * 1000
                                        }
                                    });
                                } catch (e) {
                                    console.log(e);
                                    console.log(e.stack);
                                    throw new Error("Can not store Data into DB! Please report to dev.");
                                }
                            } else {
                                const swapFromDb = await this.Swapdata.findOne({uuid: uuid});
                                console.log('swapFromDb', swapFromDb);
                                if (swapFromDb.step == 2) {
                                    if (swapFromDb.paymentspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                        try {
                                            await this.Swapdata.update({uuid: uuid}, {
                                                $set:
                                                    {
                                                        bobdeposit: swap.bobdeposit,
                                                        alicepayment: swap.alicepayment,
                                                        bobpayment: swap.bobpayment,
                                                        paymentspent: swap.paymentspent,
                                                        Apaymentspent: swap.Apaymentspent,
                                                        depositspent: swap.depositspent,
                                                        value: Number(swap.values[0].toFixed(8)),
                                                        finishtime: new Date(swap.finishtime * 1000).toGMTString(),
                                                        sorttime: swap.finishtime * 1000,
                                                        status: "pending",
                                                        finished: false,
                                                        matched: 0,
                                                        step: 3
                                                    }
                                            });
                                        } catch (e) {
                                            console.log(e);
                                            console.log(e.stack);
                                            throw new Error("Can not update Data into DB! Please report to dev.");
                                        }
                                    }
                                }

                                if (swapFromDb.paymentspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                    try {
                                        await this.Swapdata.update({ uuid: uuid }, {
                                            $set: {
                                                bobdeposit: swap.bobdeposit,
                                                alicepayment: swap.alicepayment,
                                                bobpayment: swap.bobpayment,
                                                paymentspent: swap.paymentspent,
                                                Apaymentspent: swap.Apaymentspent,
                                                depositspent: swap.depositspent,
                                                value: Number(swap.values[0].toFixed(8)),
                                                finishtime: new Date(swap.finishtime * 1000).toGMTString(),
                                                sorttime: swap.finishtime * 1000,
                                                status: "finished",
                                                finished: true,
                                                matched: 0,
                                                step: 4
                                            }
                                        });
                                    } catch (e) {
                                        console.log(e);
                                        console.log(e.stack);
                                        throw new Error("Can not update Data into DB! Please report to dev.");
                                    }
                                } else {
                                    const tempSwap = await this.Tradedata.findOne({key: "tempswap"});
                                    console.log('tempSwap', tempSwap);
                                    if (tempSwap) {
                                        if (tempSwap.tradeid == swap.tradeid) {
                                            if (swap.depositspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                                await this.Tradedata.remove({key: "tempswap"});
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        return true;
                    } catch (e) {
                        console.log(e);
                        console.log(e.stack);
                        throw e;
                    }
                }
            }
            return true;
        }
        else {
            console.log("checkswap() not ready yet");
        }
    }

    async listTransactions(coin) {
        if (await this.Userdata.count() > 1) {
            const listparams = {
                'userpass': (await this.Userdata.findOne({key: "userpass"})).userpass,
                'method': 'listtransactions',
                'coin': coin,
                'address': (await this.Userdata.findOne({coin: coin})).smartaddress.toString(),
                'count': 10
            };

            try {
                const result = await this.fetch(listparams);

                const transactions = await result.json();
                for (let i = 0; i < transactions.length; i++) {

                    var transaction = transactions[i];

                    if (!(await this.Transactions.findOne({txid: transaction.tx_hash}))) {
                        var height = transaction.height;
                        if (height === 0) {
                            height = "unconfirmed";
                        }
                        await this.Transactions.insert({
                            coin: coin,
                            txid: transaction.tx_hash,
                            height: height,
                            createdAt: new Date()
                        });
                    } else {
                        if (await this.Transactions.findOne({txid: transaction.tx_hash}).height != transaction.height) {
                            if (transaction.height != 0) {
                                await this.Transactions.update({txid: transaction.tx_hash}, {$set: {height: transaction.height}});
                            }
                        }
                    }
                }
            } catch (e) {
                throw e;
            }
        }

        while (await this.Transactions.count({coin: coin}) > 10) {
            await this.Transactions.remove((await this.Transactions.findOne({}, {sort: {height: 1}}))._id);
        }
    }
}
