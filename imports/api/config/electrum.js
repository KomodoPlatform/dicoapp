let electrumServers = { //by default KMD, BTC and LTC supported
    KMD: {
        address: '46.4.87.18',
        port: 10001,
        proto: 'tcp',
        txfee: 0,
        coin: 'KMD',
        altserverList: [
            'electrum1.cipig.net',
            'electrum2.cipig.net'
        ],
    },
    BTC: {
        address: 'electrum.hsmiths.com',
        port: 50001,
        proto: 'tcp',
        txfee: 10000,
        coin: 'BTC',
        altserverList: [
            'helicarrier.bauerj.eu'
        ],
    },
    dICOtoken: {
        address: 'electrum1.eql.com',
        port: 9681,
        proto: 'tcp',
        txfee: 10000,
        coin: 'EQL',
        altserverList: [
            'electrum2.eql.com', //alternative spv - needs to be same port
            'electrum1.eql.com'
        ],
    }
};

let tokenconfig = { //custom token config
    dICOtoken: {
        name: 'Equaliser',
        shortcode: 'EQL',
        siteurl: 'https://www.dicotoken.com',
        supporturl: 'https://helpdesk.dicotoken.com',
        pricebob: '0x_pubkey_bob',
        netid: 0,
        seed: '0.0.0.0'
    }
};

module.exports = electrumServers;
module.exports = tokenconfig;
