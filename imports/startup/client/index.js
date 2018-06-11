// Import client startup through a single index entry point

import '/imports/desktop/sharedCollections';
import './routes.js';
import { Userdata } from '/imports/api/userdata/userdata.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Tradedata } from '/imports/api/tradedata/tradedata.js';
import { Swapdata } from '/imports/api/swapdata/swapdata.js';

if (Meteor.isDesktop) {
    Desktop.shareCollection('userData', Userdata);
    Desktop.shareCollection('transactions', Transactions);
    Desktop.shareCollection('tradeData', Tradedata);
    Desktop.shareCollection('swapData', Swapdata);

    Desktop.send('desktop', 'init');
}

