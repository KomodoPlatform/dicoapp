import { app } from 'electron';

/**
 * Experimental client collection wrapper.
 *
 * @class
 */
export default class Collections {

    /**
     * @param {Object} log              - Winston logger
     * @param {Object} appSettings      - settings.json object
     * @param {Object} eventsBus        - event emitter for listening or emitting events on the
     *                                    desktop side
     * @param {PluginSettings} settings - plugin settings
     * @param {Object} Module           - reference to Module class
     */
    constructor({ log, appSettings, eventsBus, settings, Module }) {
        this.module = new Module('collections');

        // Get the automatically predefined logger instance.
        this.log = log;
        this.eventsBus = eventsBus;

        this.eventsBus.on('desktopLoaded', () => {
            this.init();
        });

        this.collections = {};
    }

    init() {
        // Do some initialization if necessary.
        this.registerApi();

        // Lets inform that the module has finished loading.
        this.eventsBus.emit('collections.loaded');
    }

    registerApi() {
        this.module.on('shareCollection', (event, fetchId, name) => {
            if (name in this.collections) {
                this.module.respond('shareCollection', fetchId, false);
            } else {
                console.log('created collection', name);
                this.collections[name] = new Collection(this, name);
                this.module.respond('shareCollection', fetchId, true);
            }
        });
    }

    getCollection(name) {
        if (!(name in this.collections)) {
            return null;
        }
        return this.collections[name];
    }
}

class Cursor {
    constructor($, id) {
        this.$ = $;
        this.id = id;
    }

    count() {
        return new Promise((resolve, reject) => {
            this.$.module.fetch('count', 2000, this.id)
                .then((count) => {
                    //console.log('count response', count);
                    if (count === null) {
                        reject();
                    } else {
                        resolve(count);
                    }
                })
                .catch(reject);
        });
    }

    fetch() {
        return new Promise((resolve, reject) => {
            this.$.module.fetch('fetch', 2000, this.id)
                .then((data) => {
                    //console.log('fetch response ', data);
                    if (data === null) {
                        reject();
                    } else {
                        resolve(data);
                    }
                })
                .catch(reject);
        });
    }

    forEach(callback, thisArg) {
        if (thisArg) {
            callback.bind(thisArg);
        }
        return new Promise((resolve, reject) => {
            this.fetch()
                .then((data) => {
                    data.forEach(callback);
                    resolve();
                })
                .catch(reject);
        });
    }

    map(callback, thisArg) {
        if (thisArg) {
            callback.bind(thisArg);
        }
        return new Promise((resolve, reject) => {
            this.fetch()
                .then((data) => {
                    resolve(data.map(callback));
                })
                .catch(reject);
        });
    }

    destroy() {
        this.$.module.fetch('destroy', 2000, this.id)
            .catch(e => {
                this.$.log.error('failed to destroy cursor');
            })
    }
}


class Collection {
    constructor($, name) {
        this.$ = $;
        this.name = name;
    }

    insert(document) {
        //console.log('insert', this.name, document);
        return new Promise((resolve, reject) => {
            this.$.module.fetch('insert', 2000, this.name, document)
                .then((args) => {
                    //console.log('insert response', args);
                    if (args[0]) {
                        reject(args[0])
                    } else {
                        resolve(args[1]);
                    }
                })
                .catch(reject);
        });
    }

    remove(selector) {
        //console.log('remove', this.name, selector);
        return new Promise((resolve, reject) => {
            this.$.module.fetch('remove', 2000, this.name, selector)
                .then((args) => {
                    //console.log('remove response', args);
                    if (args[0]) {
                        reject(args[0])
                    } else {
                        resolve(args[1]);
                    }
                })
                .catch(reject);
        });
    }

    update(selector, modifier, options = {}) {
        //console.log('update', this.name, selector, modifier, options);
        return new Promise((resolve, reject) => {
            this.$.module.fetch('update', 2000, this.name, selector, modifier, options)
                .then((args) => {
                    //console.log('update response', args);
                    if (args[0]) {
                        reject(args[0])
                    } else {
                        resolve(args[1]);
                    }
                })
                .catch(reject);
        });
    }

    findOne(selector, options = {}) {
        //console.log('findOne',this.name, selector, options);
        return new Promise((resolve, reject) => {
            this.$.module.fetch('findOne', 2000, this.name, selector, options)
                .then((args) => {
                    //console.log('findOne response', args);
                    resolve(args[0]);
                })
                .catch(reject);
        });

    }

    find(selector, options = {}) {
        //console.log('find', this.name, selector, options);
        return new Promise((resolve, reject) => {
            this.$.module.fetch('find', 2000, this.name, selector, options)
                .then((cursorId) => {
                    //console.log('find response', cursorId);
                    resolve(new Cursor(this.$, cursorId));
                })
                .catch(reject);
        });

    }

    count(selector = {}, options = {}) {
        //console.log('count', this.name, selector, options);
        return new Promise((resolve, reject) => {
            this.find(selector, options)
                .then(cursor => {
                    cursor.count()
                        .then(count => {
                            cursor.destroy();
                            resolve(count);
                        })
                        .catch(reject)
                })
                .catch(reject);
        });
    }

    fetch(selector = {}, options = {}) {
        //console.log('fetch', this.name, selector, options);
        return new Promise((resolve, reject) => {
            this.find(selector, options)
                .then(cursor => {
                    //console.log(cursor);
                    cursor.fetch()
                        .then(data => {
                            cursor.destroy();
                            resolve(data);
                        })
                        .catch(reject)
                })
                .catch(reject);
        });
    }
}
