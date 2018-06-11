if (Meteor.isDesktop) {
    Desktop.sharedCollections = {};
    Desktop.sharedCursorCounter = 0;
    Desktop.sharedCursors = {};

    Desktop.on('collections', 'insert', (event, fetchId, name, document) => {
        //console.log('insert', name);
        Desktop.sharedCollections[name].insert(document, (error, id) => {
//            console.log(error, id);
            Desktop.respond('collections', 'insert', fetchId, [error, id]);
        });
    });

    Desktop.on('collections', 'remove', (event, fetchId, name, selector) => {
        Desktop.sharedCollections[name].remove(selector, (error, id) => {
            //console.log(error, id);
            Desktop.respond('collections', 'remove', fetchId, [error, id]);
        });
    });

    Desktop.on('collections', 'findOne', (event, fetchId, name, selector, options) => {
        const args = [selector];
        if (typeof options === 'object') {
            args.push(options);
//            console.log(options);
        }
        const result = Desktop.sharedCollections[name].findOne(...args);
        Desktop.respond('collections', 'findOne', fetchId, [result]);

    });

    function getNewId() {
        if (Desktop.sharedCursorCounter === Number.MAX_SAFE_INTEGER) {
            Desktop.sharedCursorCounter = 0;
        }
        Desktop.sharedCursorCounter++;
        return Desktop.sharedCursorCounter;
    }

    Desktop.on('collections', 'find', (event, fetchId, name, selector, options) => {
        const args = [selector];
        if (typeof options === 'object') {
            args.push(options);

        }
        const cursor = Desktop.sharedCollections[name].find(...args);

        const id = getNewId();
        Desktop.sharedCursors[id] = cursor;
        Desktop.respond('collections', 'find', fetchId, id);

    });
    Desktop.on('collections', 'count', (event, fetchId, cursorId) => {
        const cursor = Desktop.sharedCursors[cursorId];
        if (cursor) {
            Desktop.respond('collections', 'count', fetchId, cursor.count());
        } else {
            Desktop.respond('collections', 'count', fetchId, null);
        }

    });
    Desktop.on('collections', 'destroy', (event, fetchId, cursorId) => {
        if (cursorId in Desktop.sharedCursors) {
            delete Desktop.sharedCursors[cursorId];
            Desktop.respond('collections', 'destroy', fetchId, true);
        } else {
            Desktop.respond('collections', 'destroy', fetchId, null);
        }

    });

    Desktop.on('collections', 'fetch', (event, fetchId, cursorId) => {
        const cursor = Desktop.sharedCursors[cursorId];
        if (cursor) {
            Desktop.respond('collections', 'fetch', fetchId, cursor.fetch());
        } else {
            Desktop.respond('collections', 'fetch', fetchId, null);
        }

    });


    Desktop.on('collections', 'update', (event, fetchId, name, selector, modifier, options) => {
        const args = [selector, modifier];
        if (typeof options === 'object') {
            args.push(options);
    //        console.log(options);
        }
        Desktop.sharedCollections[name].update(...args, (error, id) => {
  //          console.log(error, id);
            Desktop.respond('collections', 'update', fetchId, [error, id]);
        });
    });

    Desktop.shareCollection = function(name, collection) {
        Desktop.sharedCollections[name] = collection;
        Desktop.fetch('collections', 'shareCollection', undefined, name)
            .then(result => {console.log(result);});
    };
}
