# dICOapp v0.1

SPV lightweight GUI wallet with barterDEX swap capabilities (dICO compatible). This is experimental software and a functional prototype.


## Install dependencies for DEV enviroment

### OSX / LINUX

```
curl https://install.meteor.com/ | sh
git clone https://github.com/komodoplatform/dicoapp
cd dicoapp
meteor add ca333:qrcode froatsnook:sleep ostrio:meteor-root twbs:bootstrap session
meteor npm install
meteor npm install clipboard --save
meteor npm install bs58 --save
meteor npm install sha.js --save
meteor npm install pm2 --save
meteor npm install sweetalert --save
```

run the dicoapp:
```
meteor run
```

### LINUX

Follow the instructions from above (OSX) and place your marketmaker executable inside `private/static/LINUX`in the atomicDEX directory.

### WIN

Install chocolatey from https://chocolatey.org/install and afterwards install meteor via administrator command prompt:

`choco install meteor`

## Modify the dICO application

### dICO app bundle settings

Modify the file `.desktop/settings.json` to change version number and bundle/executables naming.

### Token specific modifications
Modify the files `private/static/config/coins.json`, `.desktop/assets/config/coins.json`, `.desktop/modules/marketmaker/config/electrum.js` and `imports/api/config/electrum.js` with your token-specific details such as SPV server connection details, iguana coin string and token-strings.

Below is a snippet from the electrum.js files. You can use the same data for the .desktop module (`.desktop/assets/config/coins.json`) and the imports config (`imports/api/config/electrum.js`).
```
//snippet electrum.js

dICOtoken: {
    address: '0.0.0.0', //SPV server IP
    port: 00000, //SPV port
    proto: 'tcp',
    txfee: 10000,
    coin: 'dICOtoken', //shortcode/tickersymbol of the token
    altserverList: [
        'electrum1.cipig.net', //alternative spv servers - needs to be same port
        'electrum2.cipig.net'
    ],
}
};

let tokenconfig = { //custom token config
dICOtoken: {
    name: 'dICO Token',                           //Token name
    shortcode: 'dICOT',                           //ticker symbol
    siteurl: 'https://www.dicotoken.com',         //website
    supporturl: 'https://helpdesk.dicotoken.com', //support
    pricebob: '0x_pubkey_bob',                    //pricebob publickey
    netid: 0,                                  //netid (only needed for isolated netid)
    seed: '0.0.0.0'                               //seed-ip (only needed for isolated netid)
}
};
```
Please replace the logos and icons in `.desktop/assets` and `public/img` with yours before building.

## Bundle enduser application

Install deps and meteor-desktop:
```
meteor npm install
meteor npm install --save-dev meteor-desktop
```
and make sure you have all deps and the dicoAPP desktop module installed in your app root directory.

### Package the installer


`npm run desktop -- build-installer --win`
`npm run desktop -- build-installer --linux`
`npm run desktop -- build-installer --osx`
