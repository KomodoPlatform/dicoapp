import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Userdata } from '../../api/userdata/userdata.js';
import { Tradedata } from '../../api/tradedata/tradedata.js';
import { Swapdata } from '../../api/swapdata/swapdata.js';
import electrumServers from '../../api/config/electrum.js';
import tokenconfig from '../../api/config/tokenconfig.js';
import wordlist from '../../api/config/wordlist.js';
import { Transactions } from '../../api/transactions/transactions.js';
import { sleep } from 'meteor/froatsnook:sleep';
import { rootPath} from 'meteor/ostrio:meteor-root';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import pm2 from 'pm2';
import os from 'os';
import fs from 'fs';
import path from 'path';

const numcoin = 100000000;
const txfee = 10000;


Meteor.methods({
    startWallet(passphrase) {
        Tradedata.remove({});
        Userdata.remove({});

        if (Tradedata.find().count() < 1) {
            Tradedata.insert({
                key: "priceKMD",
                price: Number(0) * numcoin,
                createdAt: new Date()
            });
            Tradedata.insert({
                key: "priceLTC",
                price: Number(0) * numcoin,
                createdAt: new Date()
            });
            Tradedata.insert({
                key: "priceBTC",
                price: Number(0) * numcoin,
                createdAt: new Date()
            });
        }
        if (Userdata.find().count() === 0) {
            const data = [{
                    coin: "LTC",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                },
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
                    coin: "BTC",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                },
            ];

            data.forEach(coin => Userdata.insert(coin));
        }

        if (os.platform() === 'darwin') {
            //fixPath();
            marketmakerBin = Meteor.rootPath + '/../../../../../private/static/OSX/marketmaker';
            marketmakerDir = `${process.env.HOME}/Library/Application Support/marketmaker`;
        } else if (os.platform() === 'linux') {
            marketmakerBin = Meteor.rootPath + '/../../../../../private/static/LINUX/marketmaker';
            marketmakerDir = `${process.env.HOME}/.marketmaker`;
        } else if (os.platform() === 'win32') {
            marketmakerBin = Meteor.rootPath + '/../../../../../private/static/WIN/marketmaker.exe';
            marketmakerBin = path.normalize(marketmakerBin);
            marketmakerDir = `${process.env.HOME}\\marketmaker`;
        } else {
            return false;
        }

        if (!fs.existsSync(marketmakerDir)) {
            fs.mkdirSync(marketmakerDir);
        }

        var coinFile = 'static/config/coins.json';
        coindata = JSON.parse(Assets.getText(coinFile));
        console.log("starting MM...")
        const startparams = {
            'gui': 'dICOApp',
            'client': 1,
            'canbind': 0,
            'userhome': `${process.env.HOME}`,
            'passphrase': "default",
            'coins': coindata
        };

        let params = JSON.stringify(startparams);
        let home = process.env.HOME;

        params = `'${params}'`;

        pm2.connect(true, function(err) { //start up pm2 god
            if (err) {
                console.error(err);
                process.exit(2);
            }
        });
        console.log("home: "+home);
        Meteor.sleep(3000);
        try {
            pm2.start({
                script: marketmakerBin, // path to MM binary
                exec_mode: 'fork',
                cwd: marketmakerDir, //set correct working dir for MM data
                args: params, //stringified params
            }, function(err, apps) {
                pm2.disconnect(); // Disconnect from PM2
                if (err) throw err;
                else {
                    console.log("started MM");
                }
            });
        } catch (e) {
            throw new Meteor.Error(JSON.parse(e));
        }
        const setparams = {
            'userpass': '1d8b27b21efabcd96571cd56f91a40fb9aa4cc623d273c63bf9223dc6f8cd81f',
            'userhome': `${process.env.HOME}`,
            'method': 'passphrase',
            'passphrase': passphrase,
            'gui': 'dICOApp',
            'netid': tokenconfig.dICOtoken.netid,
            'seednode': tokenconfig.dICOtoken.seed
        };

        Meteor.sleep(6000);
        try {
            console.log("ISSUING login call");
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: setparams
            });

            console.log("login result: " + result);
            var userpass = JSON.parse(result.content).userpass;
            console.log("userpass: " + userpass);


            try {
                console.log("set pass");
                console.log(JSON.parse(result.content));

                Userdata.insert({
                    key: "userpass",
                    userpass: JSON.parse(result.content).userpass,
                    createdAt: new Date()
                });
                Userdata.insert({
                    key: "mypubkey",
                    mypubkey: JSON.parse(result.content).mypubkey,
                    createdAt: new Date()
                });
                Userdata.insert({
                    key: "pubaddres",
                    mypubkey: JSON.parse(result.content).KMD,
                    createdAt: new Date()
                });


                var coins = JSON.parse(result.content).coins;
                for (var i = 0; i < coins.length; i++) {
                    var coinobj = coins[i];
                    try {
                        Userdata.update({
                            coin: coinobj.coin
                        }, {
                            $set: {
                                smartaddress: coinobj.smartaddress.toString()
                            }
                        });
                    } catch (e) {
                        throw new Meteor.Error(e);
                    }
                }

            } catch (e) {
                console.log(e);
                throw new Meteor.Error(e);
            }

        } catch (e) {
            throw new Meteor.Error(e);
        }

        console.log("adding electrum servers");
        const paramsKMD = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'KMD',
            'ipaddr': electrumServers.KMD.altserverList[0],
            'port': electrumServers.KMD.port
        };

        const paramsKMD2 = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'KMD',
            'ipaddr': electrumServers.KMD.address,
            'port': electrumServers.KMD.port
        };

        const paramsdICOT = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': tokenconfig.dICOtoken.shortcode,
            'ipaddr': electrumServers.dICOtoken.address,
            'port': electrumServers.dICOtoken.port
        };

        const paramsdICOT2 = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': tokenconfig.dICOtoken.shortcode,
            'ipaddr': electrumServers.dICOtoken.altserverList[0],
            'port': electrumServers.dICOtoken.port
        };

        const paramsBTC = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'BTC',
            'ipaddr': electrumServers.BTC.address,
            'port': electrumServers.BTC.port
        };

        const paramsBTC2 = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'BTC',
            'ipaddr': electrumServers.BTC.altserverList[0],
            'port': electrumServers.BTC.port
        };

        const paramsLTC = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'LTC',
            'ipaddr': 'electrum1.cipig.net',
            'port': 10065
        };

        const paramsLTC2 = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'electrum',
            'coin': 'LTC',
            'ipaddr': 'electrum2.cipig.net',
            'port': 10065
        };

        const toSend = [paramsKMD, paramsKMD2, paramsBTC, paramsBTC2, paramsdICOT, paramsdICOT2, paramsLTC, paramsLTC2];

        for (let i = 0; i < toSend.length; i++) {
                  try {
                      const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                          data: toSend[i]
                      });
                      //console.log(result);
                  } catch (e) {
                      throw new Meteor.Error(e);
                  }
                  Meteor.sleep(500);
        }

        if (Userdata.find().count() > 4) {
            Meteor.call('getbalance', 'KMD');
            Meteor.call('getbalance', tokenconfig.dICOtoken.shortcode);
            Meteor.call('getbalance', 'BTC');
            Meteor.call('getbalance', 'LTC');
        }
        console.log("connected");
    },
    sendtoaddress(coin, address, amount) {
        var outputs = '[{' + address + ':' + Number(amount) / numcoin + '}]';
        outputs = JSON.stringify(eval("(" + outputs + ")"));

        const sendparams = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass,
            'method': 'withdraw',
            'coin': coin,
            'outputs': JSON.parse(outputs)
        };
        let result = null;
        try {
            result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: sendparams
            });
            console.log(result);
        } catch (e) {
            console.log("Errror: " + e);
            throw new Meteor.Error("error", e);
        }
        const sendrawtx = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass,
            'method': 'sendrawtransaction',
            'coin': coin,
            'signedtx': JSON.parse(result.content).hex
        };
        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: sendrawtx
            });
            console.log(result);
            return result.content;
        } catch (e) {
            console.log(e);
            throw new Meteor.Error(e);
        }
    },
    getprice(paycoin) {
        if (Userdata.findOne({
                key: "userpass"
            })) {
            const getprices = {
                'userpass': Userdata.findOne({
                    key: "userpass"
                }).userpass,
                'method': 'orderbook',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin
            }
            var bestprice = 0;
            const buf = 1.07 * numcoin;
            var price = 0;
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: getprices
                });
                try {
                    if (JSON.parse(result.content).asks.length > 0) {
                        var i = 0;
                        while (i < JSON.parse(result.content).asks.length && JSON.parse(result.content).asks[i].maxvolume === 0) {
                          i++;
                        }
                        if(JSON.parse(result.content).asks[i].maxvolume > 0){
                          bestprice = Number((JSON.parse(result.content).asks[i].price * 100000000).toFixed(0));
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            } catch (e) {
                throw new Meteor.Error(e);
            }
            try {
                if (bestprice > 0) {
                    Tradedata.update({
                        key: "price" + paycoin
                    }, {
                        $set: {
                            price: Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * 100000000).toFixed(0))
                        }
                    });
                } else {
                    Tradedata.update({
                        key: "price" + paycoin
                    }, {
                        $set: {
                            price: 0
                        }
                    });
                }
            } catch (e) {
                throw new Meteor.Error(e);
            }
        } else {
            console.log("getprice() not ready yet");
        }
    },
    buy(amount, paycoin) {
        var unspent = Meteor.call("listunspent", paycoin);

        if (Number(unspent.length) < 2) {
            const getprices = {
                'userpass': Userdata.findOne({
                    key: "userpass"
                }).userpass,
                'method': 'orderbook',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin
            }
            var bestprice = 0;
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: getprices,
                    timeout: 90000
                });
                try {
                    if (JSON.parse(result.content).asks.length > 0) {
                        var i = 0;
                        while (i < JSON.parse(result.content).asks.length && JSON.parse(result.content).asks[i].maxvolume === 0) {
                          i++;
                        }
                        if(JSON.parse(result.content).asks[i].maxvolume > 0){
                          bestprice = Number((JSON.parse(result.content).asks[i].price * 100000000).toFixed(0));
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            } catch (e) {
                throw new Meteor.Error(e);
            }
            var buf = 1.07 * numcoin;
            var bufprice = Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * numcoin).toFixed(0));
            var relvolume = Number(amount / numcoin * bestprice / numcoin);
            var buyparams = null;
            if (relvolume * numcoin + txfee < Number(Userdata.findOne({
                    coin: paycoin
                }).balance)) {
                buyparams = {
                    'userpass': Userdata.findOne({
                        key: "userpass"
                    }).userpass,
                    'method': 'buy',
                    'base': tokenconfig.dICOtoken.shortcode,
                    'rel': paycoin,
                    'relvolume': relvolume.toFixed(3),
                    'price': Number(bufprice / numcoin).toFixed(3)
                }
            } else {
                throw new Meteor.Error("Not enough balance!");
            }
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: buyparams,
                    timeout: 90000
                });
            } catch (e) {
                throw new Meteor.Error(e);
            }

            return "funds in preparation";
        }
        // else{
        const getprices = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass,
            'method': 'orderbook',
            'base': "OOT",
            'rel': paycoin
        }
        var bestprice = 0;
        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: getprices,
                timeout: 60000
            });
            try {
                if (JSON.parse(result.content).asks.length > 0) {
                    var i = 0;
                    while (i < JSON.parse(result.content).asks.length && JSON.parse(result.content).asks[i].maxvolume === 0) {
                      i++;
                    }
                    if(JSON.parse(result.content).asks[i].maxvolume > 0){
                      bestprice = Number((JSON.parse(result.content).asks[i].price * 100000000).toFixed(0));
                    }
                }
            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            throw new Meteor.Error(e);
        }
        var buf = 1.08 * numcoin;
        var bufprice = Number(((buf / numcoin * bestprice / numcoin).toFixed(8) * numcoin).toFixed(0));
        var relvolume = Number(amount / numcoin * bestprice / numcoin);
        var buyparams = null;
        if (relvolume * numcoin + txfee < Number(Userdata.findOne({
                coin: paycoin
            }).balance)) {
            buyparams = {
                'userpass': Userdata.findOne({
                    key: "userpass"
                }).userpass,
                'method': 'buy',
                'base': tokenconfig.dICOtoken.shortcode,
                'rel': paycoin,
                'relvolume': relvolume.toFixed(8),
                'price': Number(bufprice / numcoin).toFixed(8)
            }
        } else {
            throw new Meteor.Error("Not enough balance!");
        }
        if (!Tradedata.findOne({
                key: "tempswap"
            }) && bestprice > 0) {
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: buyparams,
                    timeout: 90000
                });
                if (result.content.substr(2, 5) === "error") {
                    throw new Meteor.Error(result.content);
                }
                var alice = JSON.parse(result.content).pending.aliceid.toString();
                var uuid = JSON.parse(result.content).pending.uuid;

                try {
                    Tradedata.insert({
                        key: "tempswap",
                        tradeid: JSON.parse(result.content).pending.tradeid,
                        aliceid: alice.substr(0, 8),
                        uuid: uuid,
                        paycoin: paycoin,
                        expiration: JSON.parse(result.content).pending.expiration,
                        createdAt: new Date()
                    });

                    Swapdata.insert({
                        tradeid: JSON.parse(result.content).pending.tradeid,
                        expiration: JSON.parse(result.content).pending.expiration,
                        requestid: 0,
                        quoteid: 0,
                        value: amount / numcoin,
                        aliceid: alice.substr(0, 8),
                        uuid: uuid,
                        status: "pending",
                        finished: false,
                        paycoin: paycoin,
                        price: Number(bufprice / numcoin).toFixed(3),
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
                    throw new Meteor.Error(e);
                }

                return "Swap initiated - please wait min. 3 minutes before buying again!";

            } catch (e) {
                console.log(e);
                throw new Meteor.Error(e);
            }
        } else if (bestprice == 0) {
            throw new Meteor.Error("Orderbook is not synced. Please wait a few minutes.");
        } else {
            throw new Meteor.Error("Already swap ongoing - please wait until finished.");
        }

        // }
    },
    getbalance(coin) {
        const balanceparams = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass,
            'method': 'balance',
            'coin': coin,
            'address': Userdata.findOne({
                coin: coin
            }).smartaddress.toString()
        };

        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: balanceparams
            });
            try {
                Userdata.update({
                    coin: coin
                }, {
                    $set: {
                        balance: (Number(JSON.parse(result.content).balance) * numcoin)
                    }
                });
            } catch (e) {
                throw new Meteor.Error(e);
            }
        } catch (e) {
            throw new Meteor.Error(e);
            return false;
        }
    },
    listtransactions(coin) {
        if (Userdata.find().count() > 6) {
            const listparams = {
                'userpass': Userdata.findOne({
                    key: "userpass"
                }).userpass,
                'method': 'listtransactions',
                'coin': coin,
                'address': Userdata.findOne({
                    coin: coin
                }).smartaddress.toString(),
                'count': 10
            };

            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: listparams
                });

                JSON.parse(result.content).forEach(function(tx) {
                    var transaction = tx;

                    if (!Transactions.findOne({
                            txid: transaction.tx_hash
                        })) {
                        var height = transaction.height;
                        if (height === 0) {
                            height = "unconfirmed";
                        }
                        Transactions.insert({
                            coin: coin,
                            txid: transaction.tx_hash,
                            height: height,
                            createdAt: new Date()
                        });
                    } else {
                        if (Transactions.findOne({
                                txid: transaction.tx_hash
                            }).height != transaction.height) {
                            if (transaction.height != 0) {
                                Transactions.update({
                                    txid: transaction.tx_hash
                                }, {
                                    $set: {
                                        height: transaction.height
                                    }
                                });
                            }
                        }
                    }


                });

            } catch (e) {
                throw new Meteor.Error(e);
            }
        }

        while (Transactions.find({
                coin: coin
            }).count() > 10) {
            Transactions.remove(Transactions.findOne({}, {
                sort: {
                    height: 1
                }
            })._id);
        }
    },
    listunspent(coin) {
        const listunspentparams = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass,
            'method': 'listunspent',
            'coin': coin,
            'address': Userdata.findOne({
                coin: coin
            }).smartaddress.toString() //hardcoded for now
        };

        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: listunspentparams
            });
            var utxos = JSON.parse(result.content);
            return utxos;
        } catch (e) {
            throw new Meteor.Error(e);
            return false;
        }
    },
    stopwallet() {
        const stopparams = {
            'userpass': Userdata.findOne({
                key: "userpass"
            }).userpass.toString(),
            'method': 'stop'
        };

        Tradedata.remove({});
        Userdata.remove({});
        Transactions.remove({});

        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: stopparams
            });
            console.log(JSON.parse(result.content));

            pm2.connect(function(err) { //start up pm2 god
                if (err) {
                    console.error(err);
                    process.exit(2);
                }
            });
            Meteor.sleep(2000);
            try {
                pm2.stop("marketmaker", function(err, apps) {
                    if (err) throw err;
                    else {
                        console.log("stopped MM");
                    }
                });
                pm2.kill(function(err, apps) {
                    pm2.disconnect(); // Disconnect from PM2
                    if (err) throw err;
                    else {
                        console.log("stopped pm2");
                    }
                });
            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            throw new Meteor.Error(e);
        }
    },
    checkswapstatus(requestid, quoteid) {
        console.log("call checkswapstatus");
        if (Userdata.findOne({
                key: "userpass"
            })) {
            if (requestid == "" && quoteid == "" || requestid == null && quoteid == null) {
                const swaplist = {
                    'userpass': Userdata.findOne({
                        key: "userpass"
                    }).userpass,
                    'method': 'recentswaps'
                };
                try {
                    const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                        data: swaplist
                    });
                    console.log("checkswapstatus: " + result.content);
                    var swaps = JSON.parse(result.content).swaps;
                    const tempSwap = Tradedata.findOne({
                        key: "tempswap"
                    });
                    console.log('tempswap', tempSwap);
                    if (tempSwap) {
                        if (tempSwap.expiration * 1000 < Date.now()) {
                            Tradedata.remove({
                                key: "tempswap"
                            });
                        }
                    }
                    var tswaps = Swapdata.find({
                        swaplist: false
                    });
                    tswaps.forEach((swapelem) => {
                        if (swapelem.expiration * 1000 + 900000 < Date.now()) {
                            try {
                                Swapdata.update({
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
                                throw new Meteor.Error(e);
                            }
                        }
                    });

                    for (var i = 0; i < swaps.length; i++) {
                        var swapobj = swaps[i];
                        try {
                            Meteor.call('checkswapstatus', swapobj[0], swapobj[1]);
                        } catch (e) {
                            throw new Meteor.Error(e);
                        }
                    }
                } catch (e) {
                    throw new Meteor.Error(e);
                }
            } else {
                if (quoteid != 0 && requestid != 0) {
                    const swapelem = {
                        'userpass': Userdata.findOne({
                            key: "userpass"
                        }).userpass,
                        'method': 'swapstatus',
                        'requestid': requestid,
                        'quoteid': quoteid
                    };
                    try {
                        const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                            data: swapelem
                        });
                        var swap = JSON.parse(result.content);
                        var alice = swap.aliceid.toString();
                        var uuid = swap.uuid;

                        console.log("SWAPELEM: " + result.content);
                        var step = 0;
                        if (Swapdata.findOne({
                                uuid: uuid
                            })) {
                            if (Swapdata.findOne({
                                    uuid: uuid
                                }).bobpayment == "0000000000000000000000000000000000000000000000000000000000000000") {
                                console.log("bobpayment == 0");
                                try {
                                    if (Swapdata.findOne({
                                            uuid: uuid
                                        }).bobdeposit != "0000000000000000000000000000000000000000000000000000000000000000" && Swapdata.findOne({
                                            uuid: uuid
                                        }).alicepayment == "0000000000000000000000000000000000000000000000000000000000000000") {
                                        step = 1;
                                    } else if (Swapdata.findOne({
                                            uuid: uuid
                                        }).alicepayment != "0000000000000000000000000000000000000000000000000000000000000000") {
                                        step = 2;
                                    }
                                    console.log(Swapdata.findOne({
                                        uuid: uuid
                                    }).finishtime);
                                    var matched = 0;
                                    console.log(new Date(swap.finishtime * 1000).toGMTString());
                                    console.log(Swapdata.findOne({
                                        uuid: uuid
                                    }).finishtime);

                                    if (Swapdata.findOne({
                                            uuid: uuid
                                        }).finishtime === "Invalid Date" || new Date(swap.finishtime * 1000).toGMTString() === "Invalid Date") {
                                        console.log("matched");
                                        matched = 1;
                                    }
                                    Swapdata.update({
                                        uuid: uuid
                                    }, {
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
                                    throw new Meteor.Error("Can not store Data into DB! Please report to dev.");
                                }
                            } else {
                                if (Swapdata.findOne({
                                        uuid: uuid
                                    }).step == 2) {
                                      if(Swapdata.findOne({
                                              uuid: uuid
                                          }).paymentspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                          try {
                                              Swapdata.update({
                                                  uuid: uuid
                                              }, {
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
                                                      status: "pending",
                                                      finished: false,
                                                      matched: 0,
                                                      step: 3
                                                  }
                                              });
                                          } catch (e) {
                                              throw new Meteor.Error("Can not update Data into DB! Please report to dev.");
                                          }}

                                }

                                if (Swapdata.findOne({
                                        uuid: uuid
                                    }).paymentspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                    try {
                                        Swapdata.update({
                                            uuid: uuid
                                        }, {
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
                                        throw new Meteor.Error("Can not update Data into DB! Please report to dev.");
                                    }
                                } else if (Tradedata.findOne({
                                        key: "tempswap"
                                    })) {
                                    if (Tradedata.findOne({
                                            key: "tempswap"
                                        }).tradeid == swap.tradeid) {
                                        if (swap.depositspent != "0000000000000000000000000000000000000000000000000000000000000000") {
                                            Tradedata.remove({
                                                key: "tempswap"
                                            });
                                        }
                                    }
                                }
                            }
                         }
                        return true;
                    } catch (e) {
                        throw new Meteor.Error(e);
                        return false;
                    }
                }
            }
        } else {
            console.log("checkswap() not ready yet");
        }
    },
    callAPI(jobj) {
        try {
            const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                data: jobj
            });
            return result;
        } catch (e) {
            return e;
        }
    },
    hello() {
        console.log("hello");
    }
});
