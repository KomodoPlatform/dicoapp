# dICOapp v0.1

SPV lightweight GUI wallet with barterDEX swap capabilities (dICO compatible). This is experimental software and a functional prototype.


## Install dependencies

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

run the dicoapp: (current version has only OSX/WIN version of the komodoplatformdaemon included)
```
meteor run
```

### LINUX

Follow the instructions from above (OSX) and place your marketmaker executable inside `private/static/LINUX`in the atomicDEX directory.

### WIN

Install chocolatey from https://chocolatey.org/install and afterwards install meteor via administrator command prompt:

`choco install meteor`
