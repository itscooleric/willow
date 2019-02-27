/**
 * Oso Utility Functions
 * @author e@ericiscool.net
 */
const fs = require('fs'),
    papa = require('papaparse'),
    { PerformanceObserver, performance } = require('perf_hooks'),
    prototypes = {
    array: {
        /**
         * @description Max value in a series
         * @param {array} values array of numerical values
         * @returns {value} the max element in the series
         */
        max: function (key = false) {
            let ret = Number.MIN_VALUE
            if (key) for (var i = 0, il = this.length; i < il; i++) if (this[i][key] > ret) ret = this[i][key];
            if (!key) for (var i = 0, il = this.length; i < il; i++) if (this[i] > ret) ret = this[i];
            return ret;
        },
        /**
        * @description Max value in a series
        * @param {array} values array of numerical values
        * @returns {value} the max element in the series
        */
        min: function (key = false) {
            let ret = Number.MAX_VALUE
            if (key) for (var i = 0, il = this.length; i < il; i++) if (this[i][key] < ret) ret = this[i][key];
            if (!key) for (var i = 0, il = this.length; i < il; i++) if (this[i] < ret) ret = this[i];
            return ret;
        },
        columns: function (){
            return Object.keys(this[0])
        },
        first: function(key = false){
            return key?this[0][key]:this[0];
        },
        last: function(key = false){
            // return key?this[this.length-1][key]:this[this.length-1];
            return key?this.slice(-1)[0][key]:this.slice(-1)[0];
        },
        sum: function(key = false) {
            let ret = 0;
            if (key) for (var i = 0, il = this.length; i < il; i++) ret += this[i][key];
            else for (var i = 0, il = this.length; i < il; i++) ret += this[i];
            return ret;
        },
        
        arr: function(key = false) {
            let ret = [];
            if (key) for (var i = 0, il = this.length; i < il; i++) ret.push(this[i][key]);
            return ret;
        },
        vector: function(key = false) {
            return this.arr(key);
        },
        append: function(stuff, set = true){
            if (stuff.constructor == Array){
                let narr = this.concat(stuff);
                if (set) this.set(narr);
                return narr;
            } else {
                let narr = [].concat(this);
                if (set) narr.push(stuff);
                return narr;
            }
        },
        prepend: function(stuff, set = true){
            if (stuff.constructor == Array){
                let narr = stuff.concat(this);
                if (set) this.set(narr)
                return narr;
            } else {
                let narr = [stuff].concat(this);
                if (set) this.set([stuff].concat(this));
                return narr;
            }
        },
        ascend: function(key = false, set = true){
            let sorted = key?this.sort((a, b) => a[key] - b[key])
                :this.sort((a, b) => a - b);
            // if (set)  this.set(sorted);
            return sorted;
        },
        descend: function(key = false, set = true){
            let sorted = key?this.sort((b, a) => a[key] - b[key])
                :this.sort((b, a) => a - b);
            // if (set) this.set(sorted);     
            return sorted;
        },
        avg: function(key = false){
            if (key) return this.sum(key)/this.length;
            else return this.sum()/this.length
        },
        mean: function(key = false){
            return this.avg(key)
        },
        variance: function(key = false){
            let mean = this.mean(key),
                sqrs = 0,
                il = this.length;
            if (key) for (var i = 0; i < il; i++) sqrs += Math.pow(this[i][key] - mean, 2);
            else for (var i = 0; i < il; i++) sqrs += Math.pow(this[i] - mean, 2);
            return sqrs/il;
        },
        sd: function (key = false) {
            let mean = this.mean(key),
                sqrs = 0,
                il = this.length;
            if (key) for (var i = 0; i < il; i++) sqrs += Math.pow(this[i][key] - mean, 2);
            else for (var i = 0; i < il; i++) sqrs += Math.pow(this[i] - mean, 2);
            return Math.sqrt (sqrs/il);
        },
        stdev: function(key = false){
            return this.sd(key);
        },
        stats: function(key = false){
            try{
                let tobj = {
                        sum: 0,
                    },
                    mode = {},
                    il  = this.length,
                    qt4 = il - 1,
                    qt2 = Math.floor(qt4/2),
                    qt1 = Math.floor(qt4/4),
                    qt3 = qt2 + qt1,
                    sqs = 0,
                    min = Number.MAX_VALUE,
                    max = Number.MIN_VALUE;
                if (key) for (let i = 0; i < il; i++) {
                    let t = this[i][key];
                    // Sum
                    tobj.sum += t;
                    // Mode
                    if (mode[t]) mode[t][1]++; 
                    else mode[t] = [t, 1];
                    // Percentiles
                    if (i == qt1) tobj.pct25        = t;
                    else if (i == qt2) tobj.pct50   = t;
                    else if (i == qt3) tobj.pct75   = t;
                    else if (i == qt4) tobj.pct100  = t;
                    // Min max
                    if (t < min) min = t;
                    else if (t > max) max = t;
                }
                if (!key) for (let i = 0; i < il; i++) {
                    let t = this[i];
                    // Sum
                    tobj.sum += t;
                    // Mode
                    if (mode[t]) mode[t][1]++; 
                    else mode[t] = [t, 1];
                    // Percentiles
                    if (i == qt1) tobj.pct25        = t;
                    else if (i == qt2) tobj.pct50   = t;
                    else if (i == qt3) tobj.pct75   = t;
                    else if (i == qt4) tobj.pct100  = t;
                    // Min max
                    if (t < min) min = t;
                    else if (t > max) max = t;
                }
                tobj.mean = tobj.sum / il;
                tobj.mode = key?mode[this[0][key]]:mode[this[0]]
                // Loop again for stdev
                if (key) for (let i = 0; i < il; i++) {
                    let t = this[i][key];
                    sqs += Math.pow(this[i][key] - tobj.mean, 2);
                    tobj.mode = mode[t][1] > tobj.mode[1]?mode[t]:tobj.mode;
                } 
                if (!key) for (let i = 0; i < il; i++) {
                    let t = this[i];
                    sqs += Math.pow(this[i] - tobj.mean, 2);
                    tobj.mode = mode[t][1] > tobj.mode[1]?mode[t]:tobj.mode;
                }
                tobj.variance   = sqs/il;
                tobj.sd         = Math.sqrt(tobj.variance);
                tobj.mode       = tobj.mode[0];
                tobj.min        = min;
                tobj.max        = max;
                return tobj;
            } catch(err){
                console.error(err);
            }
        },
        values: function (key){
            if (key) return this.map(a => a[key])
            else {
                console.err('No key selected')
                return false;
            }
        },
        options: function (key) {
            return this.values(key).unique()
        },
        /**
         * Returns an array with arrays of the given size.
         *
         * @param tsize {Integer} the size (count) of each chunk 
        */
        chunk: function(tsize){
            let tret = [],
                tind = 0,
                tlen = this.length;
            while (tind < tlen) {
                tret.push(this.slice(tind, tind + tsize));
                tind += tsize;
            }
            return tret;
        },
        unique: function removeDuplicates(prop = false) {
            var obj = {};
            if (prop) for (var i = 0, len = this.length; i < len; i++) {
                if (!obj[this[i][prop]]) obj[this[i][prop]] = this[i];
            } else for (var i = 0, len = this.length; i < len; i++) {
                if (!obj[this[i]]) obj[this[i]] = this[i];
            }
            var newArr = [];
            for (var key in obj) newArr.push(obj[key]);
            return newArr;
        },
        merge: function (column1, data2, column2, authority = 0) {
            let startTime = performance.now(),
                data1 = this.slice(0),
                // Array of column from dataset 2
                contentObj = {},
                //  Empty Object to assign if there is no matching data
                emptyObj = {},
                // Array that is returned
                returnArray = [],
                cols1 = Object.keys(data1[0]),
                cols2 = Object.keys(data2[0]),
                // Number of matches found
                matchCount = 0;
            data2.map((a, i) => contentObj[a[column2]] = i)
            cols2.map(c => {
                if (!data1[0][c]) emptyObj[c] = '';
                else emptyObj[c + '_2'] = ''
            });
            for (let i = 0, il = data1.length; i < il; i++) {
                // Looks in content array for the current item
                let tv = data1[i][column1],
                    ti = typeof contentObj[tv] != undefined ? contentObj[tv] : -1,
                    tObj = {};
                Object.assign(tObj, data1[i]);
                // Combining objects if there is a match
                if (ti >= 0) {
                    if (authority == 1) cols2.map(c => tObj[c] = cols1.includes(c) ? tObj[c] : data2[ti][c] || '');
                    if (authority == 2) cols2.map(c => tObj[c] = data2[ti][c] || '');
                    else cols2.map(c => tObj[cols1.includes(c) ? c + '_2' : c] = data2[ti][c] || '');
                    Object.assign(tObj, data2[ti]);
                    matchCount++;
                }
                else Object.assign(tObj, emptyObj)
                returnArray.push(tObj)
            }
            console.log(`Merged ${matchCount}/${data1.length} items in ${(performance.now() - startTime).toFixed(2)} ms.`)
            return returnArray;
        },
        do: function(key, fn = () => true, set = true) {
            let tarr = this.slice(0);
            for (let i = 0, il = tarr.length; i < il; i++) tarr[i][key] = fn(tarr[i], i, tarr);
            if (set) for (let i = 0, il = this.length; i < il; i++) this[i][key] = fn(this[i], i, this);
            return tarr;
        },
        /**
         * Calculate something based on groups
         */
        calc: function(key, fn_filter = () => true){
            let tarr = [], garr = this.group(key);
            for (let i = 0, il = this.length; i < il; i++) tarr.push(fn(this[i], i, this))
            return tarr;
        },
        /**
         * Calculate something based on groups
         */
        keep: function(fn = () => true, set = true){
            let tarr = [];
            for (let i = 0, il = this.length; i < il; i++){
                let ii = this[i];
                if (fn(ii, i, this)) tarr.push(ii)
            }
            if (set) this.set(tarr);
            return tarr;
        },
        /**
         * Makes array of objects based on the evaluated fn with the key fn pairs
         */
        make: function() {
            let tarr = [], ar = arguments.slice(0);
            console.log(ar);
            debugger;
            for (let i = 0, il = this.length; i < il; i++){
                let to = {};
                for (let j = 0, jl = ar.length; j < jl; j+=2){
                    to[ar[j]] = fn(this[i], i, this);
                }
                tarr.push(to);
            }
        },
        /**
         * group parts of an array together based on a filter function or maybe based on key value pairs
         */
        classify_old: function(key) {
            let tarr = [], vals = {};
            for (let i = 0, il = this.length; i < il; i++) {
                let val = this[i][key]
                if (vals[val]) vals[val] = [this[i]];
                else vals[val].push(this[i])
            }
            return tarr;
        },
        /**
        * group parts of an array together based on a filter function or maybe based on key value pairs
        */
        classify: function(key) {
            let vals = {};
            for (let i = 0, il = this.length; i < il; i++) {
                let val = this[i][key]
                if (!vals[val]) vals[val] = [this[i]];
                else vals[val].push(this[i])
            }
            return vals;
        },
        /**
         * Function to filter an array and execute a function on the new array or make the originaal such
         */
        get: function(key, fn = () => true, ret = false) {
            let tarr = [];
            for (let i = 0, il = this.length; i < il; i++) if (fn(this[i], i, this)) tarr.push(i);
            if (set) for (let i = 0, il = tarr.length; i < il; i++) this[tarr[i]][key] = fn(this[tarr[i]], tarr[i], this, i)
            return tarr;
        },
        shuffle: function (set = true) {
            if (set) {
                for (let i = this.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    [this[i], this[j]] = [this[j], this[i]];
                }
                return this;
            } else {
                let tarr = this.slice(0);
                for (let i = this.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    [tarr[i], tarr[j]] = [tarr[j], tarr[i]];
                }
                return tarr;
            }
        },
        // Data stuff
        write: function (fileName = false, delimeter = ',', quotes = true){
            return new Promise((resolve, reject) => {
                try {
                    let tdel = fileName?fileName.length == 1? fileName:delimeter:delimeter,
                        tfn = fileName? fileName.length > 1? fileName:delimeter.length > 1?delimeter:false:false,
                        q = quotes?'"':'',
                        th = Object.keys(this[0]).filter(a => {
                            let tcon = this[0][a]?this[0][a].constructor:Number,
                                tgood = tcon != Array && tcon != Object;
                            if (!tgood) console.log(`Dropping ${a} from csv export because of data type`);
                            return tgood;
                        }),
                        dhead = `${th.map(a => q + a + q).join(tdel)}\n`
                        dbody = `${this.map(t => {
                            return th.map(h => q + ((typeof t[h] == 'undefined'?null:t[h]) + '').replace(/\n|\"|"/g, '') + q).join(tdel)
                        }).join('\n')}`;
                    if (tfn)  fs.writeFile(tfn, dhead+dbody, err => {
                            if (err) reject(err)
                            else resolve(true);
                        })
                    else resolve(dhead+dbody) 
                    tm = null, th = null, dhead = null, dbody = null;
                } catch (err) {
                    console.log(err)
                    reject(err)
                }
            })
        },
        read: function (locations = false) {
            let ars = Array.from(arguments),
                files = ars.length == 1? ars[0].constructor == String? [ars[0]] 
                            : ars[0].constructor == Array? ars[0]
                            : false
                        :ars.length > 1? ars
                    :false;
            return new Promise((resolve, reject) => {
                if (files && files.every(a => a.constructor == String)) {
                    let af = [],
                        save = () => {
                            let f = files.shift();
                            // console.log(`File is ${f}`)
                            // console.log(`Reading ${f}`);
                            e.read(f, true)
                            .then(res => {
                                delete f;
                                // console.log(`Successfully read ${f}`);
                                af = af.concat(res);
                                if (files.length > 0) save()
                                else {
                                    // console.log(`File reading complete. Read ${af.length} records`)
                                    this.set(af);
                                    resolve(true);
                                }
                            })                        
                            .catch(err => {
                                console.error(err);
                                reject(err);
                            })
                        };
                    save();
                } else {
                    this.set();
                    console.error('No location specified!')
                    reject([]);
                }
            })
        },
        delete: function (){
            return new Promise((resolve, reject) => {
                if (this.length > 0 && this.every(a => a.constructor == String)) {
                    Promise.all(this.map(f => e.delete(f)))
                    .then(res => {
                        console.log(`Successfully deleted: ${this.join(', ')}`)
                        resolve(res);
                    })
                    .catch(err => {
                        console.error(err);
                        reject(err);
                    })
                } else {
                    this.set();
                    console.warn('No locations specified!')
                    resolve();
                }
            })
        },
        set: function(data = []) {
            this.splice(0)
            for (let i = 0, il = data.length; i < il; i++) this.push(data[i]);
        },
        parseInt: function () {
            let len = this.length,
                wid = Object.keys(this[0]).length,
                cells = len*wid,
                start = performance.now(),
                // method = Math.random()*2 > 1,
                nkeys = Object.keys(this[0]);
            if (1 == 2) for (let i = 0; i < len; i++){
                let t = this[i];
                nkeys.map(k => t[k] = +(t[k]))///^[0-9.]*$/.test(t[k])?+t[k]:t[k]);
            } else {
                for (let i = 0; i < len; i++){
                    let t = this[i];
                    nkeys.map(k => t[k] = /^[0-9.-]*$/.test(t[k])?+t[k]:t[k]);
                }
            }
        },
    },
    date: {
        stamp: function(isTime = false, joinBy = '') {
            let ret = [this.getFullYear(), (this.getMonth()+1).pad(), (this.getDate()).pad()];
            if (isTime) ret = ret.concat([joinBy, this.getHours().pad(), this.getMinutes.pad()])
            return ret.join('');
        },
        mmddyyyy: function(pad = false){
            if (pad) (this.getMonth() + 1).pad() + "/" + this.getDate().pad() + "/" + this.getFullYear().pad();
            else return this.getMonth() + 1 + "/" + this.getDate() + "/" + this.getFullYear();
        },
        format: function() {
            return this.mmddyyyy();
        },
        days: function(end){
            return Math.abs((this - new Date(end))/86400000)
        },
        fy: function() {
            return this.getFullYear() + ((this.getMonth()+1)<= 9?0:1);
        },
        monthName: function() {
            let monthList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                month = this.getMonth();
            return monthList[month];
        },
        between: function (fromDate, toDate) {
            return (Date.parse(this) >= Date.parse(fromDate) && Date.parse(this) <= Date.parse(toDate)) ? true : false
        },
        time: function(sw = false) {
            if (!sw) {
                return `${this.getHours().pad()}:${this.getMinutes().pad()}:${this.getSeconds().toFixed(0).pad()}`
            } else {
                let hh = Date.parse(this)/(60*60*1000),
                    mm = (hh % 1) * 60,
                    ss = (mm % 1) * 60,
                    c  = n => pad(Math.floor(n));
                return `${c(hh)}:${c(mm)}:${c(ss)}`
            }
        },  
        date: function() {
            return this.format()
        },
        dateTime: function() {
            return`${this.date()} ${this.time()}`
        },
        yesterday: function() {
            let day = 1;
            return new Date(Date.parse(this) - day.toMs())
        },
        parse: function() {
            return Date.parse(this)
        }
    },
    number: {
        toMs: function() {
            return this*24*60*60*1000
        },
        pad: function(padding = 2){
            return this.toString().length < padding ? new Array(padding - this.toString().length).fill('0').concat(this).join('') : this.toString()
        },
        percent: function (decimals = 0) {
            return (this*100).toFixed(decimals)
        },
        time: function() {
            let hh = this/(60*60*1000),
                mm = (hh % 1) * 60,
                ss = (mm % 1) * 60,
                c = n => Math.floor(n).pad();
            return `${c(hh)}:${c(mm)}:${c(ss)}`
        },
        stamp: function(time = false, joinBy = '') {
            let date = new Date(this),
                ret = [date.getFullYear(), (date.getMonth()+1).pad(), (date.getDate()).pad()];
            if (time) ret = ret.concat([joinBy, date.getHours().pad(), date.getMinutes.pad()])
            return ret.join('');
        },
        date: function(str = true){
            if (str) return new Date(this).format()
            else return new Date()
        }
    },
    string: {
        // Removes special characters from string
        removeSpecial: function(ret = false) {
            let str = this.replace(/[^\w\s]/gi, '')
            return str;
        },
        // Removes quotes from string
        removeQuotes: function(ret = false) {
            let str = this.replace(/\"/g,'')
            return str;
        },
        camelize: function(ret = false) {
            let str = this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
              if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
              return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
            return str;
        },
        pad: function(padding = 2){
            return this.length < padding ? new Array(padding - this.length).fill('0').concat(this).join('') : this
        },
    },
    object: {
        // write: loc => {
        //     return new Promise((resolve, reject) => {
        //         try {
        //             console.log(this)
        //             let data = JSON.stringify(this);
        //             debugger;
        //             fs.writeFile(loc, data, err => {
        //                 if (err) reject(err)
        //                 else resolve(true);
        //             })
        //         } catch (err) {
        //             console.log(err)
        //             reject(err)
        //         }
        //     })
        // },
        // read: loc => new Promise(())
    }
};
e = {
    ext: loc => loc.substr(loc.lastIndexOf('.')),
    open: loc => new Promise((resolve, reject) => {
        fs.readFile(loc, 'UTF-8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    }),
    save: (data, loc) => new Promise((resolve, reject) => {
        fs.writeFile(loc, data, err => {
            if (err) reject(err)
            else resolve(true);
        })
    }),
    fix: (arr) => {
        let tkeys = Object.keys(arr[0]),
            nkeys = [];
        tkeys.map((k, i) => {
            if (/\r|\n|"|\"/g.test(k)) {
                nkeys.push({
                    old: k,
                    new: k.replace(/\r|\n|"|\"/g, '')
                })
            }
        })
        arr.map(row => {
            nkeys.map(key => {
                row[key.new] = (row[key.old]+'').replace(/\r|\n|"|\"/g, '');
                delete row[key.old];
            })
        })
        return arr;
    },
    read: (loc, fast = false) => new Promise((resolve, reject) => {
        e.open(loc)
        .then(data => {
            switch (e.ext(loc)){
                case('.txt'):
                case('.csv'):
                    papa.parse(data, {
                        header: true,
                        fastMode: fast,
                        complete: res => resolve(res.data)
                    })
                    break;
                case('.json'):
                    try { resolve(JSON.parse(data))} 
                    catch(err){reject(err)}
                    break;
                default:
                    console.log('Unsure of the file type homie')
                    reject('Unknown filetype selected');
                    break;
            }
        })
        .catch(err => reject(err))        
    }),
    write: (data, loc, delimeter = ',') => {
        try{
            switch (data.constructor){
                case(Array):
                    return data.csv(loc, delimeter);
                    break;
                case(Object):
                    return e.save(JSON.stringify(data), loc)
                    // return data.write(loc);
                    break;
                default:
                    return e.save(data, loc);
                    break;
            }
        } catch(err) {
            console.error(err);
            debugger;
        }
    },
    delete: loc => new Promise((resolve, reject) => {
        fs.unlink(loc, err => {
            if (err) {
                console.error(err);
                reject(err)
            } else resolve()
        })
    }),
    scan: loc => new Promise((resolve, reject) => {
        fs.readdir(loc, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    }),
    mkdir: (path, recursive = true) => new Promise((resolve, reject) => {
        if (e.exists(path)) resolve(true);
        else fs.mkdir(path, { recursive: recursive }, (err) => {
            if (err) {
                console.error(err);
                reject(err);
            } else resolve(path);
        });
    }),
    table: function clitable(tobj, thead = false){
        let okeys = Object.keys(tobj),
            mKey  = Math.max.apply(this, okeys.map(k => `${k}`.length)),
            ovals = Object.values(tobj),
            mVal  = Math.max.apply(this, ovals.map(k => `${k}`.length)),
            ttop  = (new Array(mVal+mKey+4).fill('-')).join(''),
            rows  = [thead||'codebox table',ttop]
                .concat(okeys.map((k, i) => `${k+(new Array((mKey - k.length)+1))
                .fill(' ')
                .join('')}: ${ovals[i]}`));
        rows = rows.join('\n')
        console.log(rows);
        return rows;
    },
    wait: function waitFor(cb, timeout = 0, interval = 500) {
        return new Promise((resolve, reject) => {
            let start = performance.now(),
                endLimit = timeout > 0 ? start + timeout : Infinity,
                timer = setTimeout(function tick() {
                    let p;
                    try {
                        p = cb();
                    } catch (err) {
                        p = false;
                    }
                    if (p != false && typeof p != 'undefined' && p != null && p != undefined) {
                        resolve(p);
                    } else {
                        if (performance.now() > endLimit) {
                            resolve(false);
                        }
                        else timer = setTimeout(tick, interval);
                    }
                }, interval);
        })
    },
    exists: path => fs.existsSync(path)
};
/** 
 * Task Estimated Time of Completion Section
 * This will calculate ETA/ETC for different transactions
 * TODO:
 *      IMPLEMENT DAMNIT!
 *      Maybe also add a class thats like a dataframe or matrix that runs these things well....
 *      Integrate weighted formula
 */
e.task = {
    list: [],
    init: (taskName, taskLength, taskInterval = 1000, taskStart = Date.now()) => {
        if (taskName && taskLength){
            let ti = _.task.list.length,
                t = {
                    // Keep track of which task
                    id: ti,
                    // Name for each task
                    name: taskName,
                    // Begining of task
                    start: taskStart,
                    // Length for computing etc and detecting completion
                    il: taskLength,
                    // Index of the current process
                    i: 0,
                    status: '',
                    table: {},
                    etc: 0,
                    complete: null
                };
            t.msg = msg =>  _.log(msg)
            // To clear completion
            t.end = (quit = t.i < t.il, reason = 'Something broke') => {
                if (!quit){
                    t.status = 'Complete';
                } else {
                    t.status = 'Aborted'
                    t.msg = `Quit at ${((t.i/t.il)*100).toFixed(2)}% / ${_tbd.time(Date.now() - t.start, true)}: ${reason}`;
                }
                setTimeout(() => {
                    let totalTime = Date.now() - t.start;
                    ui.log(`Successfully completed operation '${t.name}' after ${_tbd.time(totalTime, true)} at ~${(t.il/(totalTime/1000)).toFixed(2)} items/sec`)
                    t.complete = Date.now();
                }, 3000)
            }
            t.update = () => {
                // JS Question, will task start remain this task start? or will it change to another if I'm running two etcs
                let elapsed       = Date.now() - t.start,
                    rowsRemaining = t.il - t.i,
                    timeRemaining = rowsRemaining * (elapsed/t.i),
                    estimatedTime = tb.time(timeRemaining, true),    //tb.dateTime(new Date(Date.now()+timeRemaining)),
                    progress      = ((t.i/t.il)*100).toFixed(2);
                    // Strings for the array. Sort of useless variables but good for debugging. Clean up for production
                t.table = {
                    id: t.id,
                    status: t.status,
                    name: t.name,
                    progress: progress+'%',
                    count: t.i+'/'+t.il,
                    elapsed: tb.time(elapsed, true),
                    estimated:`${/Invalid|NaN/i.test(estimatedTime)?'End of Time':estimatedTime}`,
                    msg: t.msg,
                };
                if (t.i < t.il && !t.complete) t.timeout();
                else t.end()
            }
            // Timeout to update the status
            t.timeout = () => setTimeout(() => t.update(), 1000)
            t.update();
            _.task.list.push(t)
            _.status(`Initiated task titled ${taskName} at ${_tbd.dateTime(new Date())}`, 1500)
            return t.id;
        } else _.status(`Unable to initiate new task. Invalid parameters submitted.`, 4000);
        return false;
    },
    report: (taskID, killTask = 0) => {
        let t = _.task.list[taskID];
        if (!t) console.error('Invalid taskID');
        else if (killTask == 0) t.i++
        else if (killTask == 1) t.i = t.il;
        else if (killTask == -1) t.complete = true;
    },
    
}
e.initObj = {
    array: {
        type: Array,
        keys: []
    },
    date: {
        type: Date,
        keys: []
    },
    number: {
        type: Number,
        keys: []
    },
    string: {
        type: String,
        keys: []
    },
    object: {
        type: Object,
        keys: []
    }
};
// Initialization
Object.keys(e.initObj).map(pk => {
    let p = prototypes[pk];
    p.keys = Object.keys(p);
    try {
        p.keys.map(k => {
            Object.defineProperty(e.initObj[pk].type.prototype, k, {
                enumerable: false,
                writable: true,
                value: p[k]
            })
        })
    } catch (err) {
        console.error(err);
        debugger;
    }
})
module.exports = e;