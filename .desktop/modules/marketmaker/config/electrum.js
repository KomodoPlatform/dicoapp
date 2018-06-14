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

module.exports = electrumServers;
