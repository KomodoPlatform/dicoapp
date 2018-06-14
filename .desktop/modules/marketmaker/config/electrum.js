let electrumServers = {
    KMD: {
        address: '46.4.87.18',
        port: 10001,
        proto: 'tcp',
        txfee: 0,
        coin: 'KMD',
        altserverList: [
            'electrum1.cipig.net:10001',
            'electrum2.cipig.net:10001'
        ],
    },
    BTC: {
        address: '46.4.87.18',
        port: 10000,
        proto: 'tcp',
        txfee: 10000,
        coin: 'BTC',
        altserverList: [
            '46.4.78.11'
        ],
    },
    ZEC: {
        address: 'electrum.hsmiths.com',
        port: 50001,
        proto: 'tcp',
        txfee: 10000,
        coin: 'ZEC',
        altserverList: [
            'helicarrier.bauerj.eu:50001',
            'node1.komodo.rocks:50001',
            'electrum.hsmiths.com:50001',
            'electrum.bntn.host:50036'
        ],
    },
    dICOtoken: {
        address: '0.0.0.0',
        port: 0,
        proto: 'tcp',
        txfee: 10000,
        coin: 'dICOtoken',
        altserverList: [
            'electrum1.cipig.net', //alternative spv - needs to be same port
            'electrum2.cipig.net'
        ],
    }
};

module.exports = electrumServers;
