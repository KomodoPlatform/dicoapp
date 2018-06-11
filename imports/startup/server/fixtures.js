// initialization

import { Meteor } from 'meteor/meteor';
import { Userdata } from '../../api/userdata/userdata.js';
import { Tradedata } from '../../api/tradedata/tradedata.js';
import { Transactions } from '../../api/transactions/transactions.js';
import { rootPath} from 'meteor/ostrio:meteor-root';
import pm2 from 'pm2';
import os from 'os';
import { sleep } from 'meteor/froatsnook:sleep';
// import fixpath

import '../../api/marketmaker/update.js'

const numcoin = 100000000;

Meteor.startup(() => {
   Userdata.remove({});
   Tradedata.remove({});
   Transactions.remove({});
      if(Transactions.find().count() < 1){
        Transactions.insert({
          coin: "KMD",
          txid: "txid",
          heigth: "height",
          createdAt: new Date()
        });
      }

});
