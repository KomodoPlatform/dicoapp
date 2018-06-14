/* eslint-disable no-unused-vars */
import process from 'process';
import { app, dialog, Menu } from 'electron';
import { exec } from 'child_process';
import os from 'os';
import spawn from 'cross-spawn';

process.traceDeprecation = true;

/**
 * Entry point to your native desktop code.
 *
 * @class
 */
export default class Desktop {
    /**
     * @param {Object} log         - Winston logger instance
     * @param {Object} skeletonApp - reference to the skeleton app instance
     * @param {Object} appSettings - settings.json contents
     * @param {Object} eventsBus   - event emitter for listening or emitting events
     *                               shared across skeleton app and every module/plugin
     * @param {Object} modules     - references to all loaded modules
     * @param {Object} Module      - reference to the Module class
     * @constructor
     */
    constructor({
        log, skeletonApp, appSettings, eventsBus, modules, Module
    }) {
        /**
         * You can delete unused var from the param destructuring.
         * Left them here just to emphasize what is passed. Delete the eslint rule at the top
         * when done.
         * You can also just have a one `config` param and do `Object.assign(this, config);`
         */
        const desktop = new Module('desktop');
        // Get the automatically predefined logger instance.
        this.log = log;

        if (skeletonApp.isProduction()) { // in production mode redirect console to logs
            const { log: logg, warn, error } = console;
            console.log = (...args) => {
                this.log.info(...args);
                logg(...args);
            };
            console.warn = (...args) => {
                this.log.warn(...args);
                warn(...args);
            };

            console.error = (...args) => {
                this.log.error(...args);
                error(...args);
            };
        }

        this.modules = modules;

        // From Meteor use this by invoking Desktop.send('desktop', 'closeApp');
        desktop.on('closeApp', () => app.quit());

        desktop.on('init', this.init.bind(this));

        // We need to handle gracefully potential problems.
        // Lets remove the default handler and replace it with ours.
        skeletonApp.removeUncaughtExceptionListener();

        process.on('uncaughtException', Desktop.uncaughtExceptionHandler);

        // Chrome problems should also be handled. The `windowCreated` event has a `window`
        // reference. This is the reference to the current Electron renderer process (Chrome)
        // displaying your Meteor app.
        eventsBus.on('windowCreated', (window) => {
            window.webContents.on('crashed', Desktop.windowCrashedHandler);
            window.on('unresponsive', Desktop.windowUnresponsiveHandler);
            this.setContextMenu();
        });

        // Consider setting a crash reporter ->
        // https://github.com/electron/electron/blob/master/docs/api/crash-reporter.md
    }

    setContextMenu() {
        var template = [{
            label: "Application",
            submenu: [
                { label: "Quit dICOApp", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }}
            ]}, {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]}
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    killMarketmaker() {
        console.log(os.platform());
        if (os.platform() === 'win32') {
            try {
                const out = spawn
                    .sync(
                        'wmic',
                        ['process', 'where', 'caption="marketmaker.exe"', 'get', 'processid']
                    )
                    .stdout.toString('utf-8')
                    .split('\n');

                const regex = new RegExp(/(\d+)/, 'gm');
                // No we will check for those with the matching params.
                console.log(out);
                out.forEach((line) => {
                    const match = regex.exec(line) || false;
                    if (match) {
                        console.log(`killing marketmaker.exe at pid: ${match[1]}`);
                        spawn.sync('taskkill', ['/pid', match[1], '/f', '/t']);
                    }
                    regex.lastIndex = 0;
                });
            } catch (e) {
                console.log('killing marketmaker.exe failed');
            }
        }
        if (os.platform() === 'darwin') {
            exec('pkill -f marketmaker', {shell: true}, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });
        }
        if (os.platform() === "linux") {
            exec('pkill -f marketmakerlinux', {shell: true}, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });
        }
    }


    async init() {

        this.killMarketmaker();

        const collections = this.modules.collections;
        const Transactions = collections.getCollection('transactions');

        if (await Transactions.count() < 1) {
            Transactions.insert({
                coin: 'KMD',
                txid: 'txid',
                heigth: 'height',
                createdAt: new Date()
            });
        }

        this.startTimers();
        process.on('unhandledRejection', r => console.log(r.stack))

    }

    startTimers() {
        const collections = this.modules.collections;
        const Userdata = collections.getCollection('userData');
        const Tradedata = collections.getCollection('tradeData');
        setInterval(async () => {

            // try{
            //   console.log(Userdata.find().count());
            //   Userdata.remove();
            //   console.log("removed");
            // }catch(e){
            //   console.log(e);
            // }

            if(await Userdata.count() > 4) {
                console.log('getBalance timer');
                await this.modules['marketmaker'].getBalance(tokenconfig.dICOtoken.shortcode);
                await this.modules['marketmaker'].getBalance('KMD');
                await this.modules['marketmaker'].getBalance('LTC');
                //await this.modules['marketmaker'].getBalance('LTC');
            }
            if(await Userdata.count() > 4 && await Tradedata.count() > 0) {
                await this.modules['marketmaker'].getPrice('KMD');
                await this.modules['marketmaker'].getPrice('LTC');
                //await this.modules['marketmaker'].getPrice('LTC');
                await this.modules['marketmaker'].checkSwapStatus();
            }
        }, 60000);

        setInterval(async () => {
            // try{
            //   console.log(Userdata.find().count());
            //   Userdata.remove();
            //   console.log("removed");
            // }catch(e){
            //   console.log(e);
            // }
            console.log('list transactions');

            if (await Userdata.count() > 6) {
                await this.modules['marketmaker'].listTransactions("KMD");
                await this.modules['marketmaker'].listTransactions(tokenconfig.dICOtoken.shortcode);
                //await this.modules['marketmaker'].listTransactions("LTC");
                await this.modules['marketmaker'].listTransactions("LTC");
            }

        }, 90000);
    }

    /**
     * Window crash handler.
     */
    static windowCrashedHandler() {
        Desktop.displayRestartDialog(
            'Application has crashed',
            'Do you want to restart it?'
        );
    }

    /**
     * Window's unresponsiveness handler.
     */
    static windowUnresponsiveHandler() {
        Desktop.displayRestartDialog(
            'Application is not responding',
            'Do you want to restart it?'
        );
    }

    /**
     * JS's uncaught exception handler.
     * @param {string} error - error message
     */
    static uncaughtExceptionHandler(error) {
        // Consider sending a log somewhere, it is good be aware your users are having problems,
        // right?
        Desktop.displayRestartDialog(
            'Application encountered an error',
            'Do you want to restart it?',
            error.message
        );
    }

    /**
     * Displays an error dialog with simple 'restart' or 'shutdown' choice.
     * @param {string} title   - title of the dialog
     * @param {string} message - message shown in the dialog
     * @param {string} details - additional details to be displayed
     */
    static displayRestartDialog(title, message, details = '') {
        dialog.showMessageBox(
            {
                type: 'error', buttons: ['Restart', 'Shutdown'], title, message, detail: details
            },
            (response) => {
                if (response === 0) {
                    app.relaunch();
                }
                app.exit(0);
            }
        );
    }
}
