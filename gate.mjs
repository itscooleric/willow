/**
 * Just a javascript file for running tests in willow so I'm  not writing
 * a bunch of test code at the bottom
 * EMSCRIPTEN! https://emscripten.org/docs/getting_started/index.html
 * 
 * Other:
 *  https://github.com/nuanio/xgboost-node
 * https://www.npmjs.com/package/python
 * https://www.npmjs.com/package/python-shell
 * https://github.com/extrabacon/python-shell
 * 
 * ROC: https://github.com/mljs/performance
 * Calculus: https://github.com/mljs/calculus
 *  
 */
var willow      = require('./willow.js'),
    util        = require('./util.js'),
    crit        = require('./crit.js'),
    // boss        = require('./boss'),// TODO Remove chalk req
    performance = require('perf_hooks').performance,
    e           = {};

const profiler = (fn, count = 1000) => {
    let ret = [];
    for (let i = 0; i < count; i++){
        let startProfile = performance.now();
        fn()
        let finishProfile = performance.now();
        ret.push(finishProfile - startProfile);
    }
    return Object.assign({data: ret}, ret.stats())
}
const init = async () => {
    let df = (await util.read('E:/docs/predecessor/Data/1x5nb.csv')).slice(-50000),
        target = 'result';
    df.parseInt();
    df = df.filter(a => Object.values(a).every(b => !isNaN(b)))
    // console.log(df[0])
    // debugger;
    require('ml-xgboost').then(async XGBoost => {
        var booster = new XGBoost({
            booster         : 'gbtree',
            objective       : 'binary:logistic',
            max_depth       : 5,
            eta             : 0.1,
            min_child_weight: 1,
            subsample       : 0.5,
            colsample_bytree: 1,
            silent          : 1,
            iterations      : 200
        });
    
        var X_train = [],
            y_train = [],
            x_keys = Object.keys(df[0]).filter(a => a != target);
        df.map(a => {
            X_train.push(x_keys.map(b => a[b]));
            y_train.push(a[target])
        })    
        // console.log(X_train[0]);
        // console.log(y_train[0]);
        console.log(`About to train the model now`);
        booster.train(X_train, y_train);
        var X_test = X_train,/* something to predict */
            y_pred = booster.predict(X_test),
            preddf = df.map((a, i) => {
                return Object.assign({pred: y_pred[i]}, a);
            }),
            score = await crit.score({
                data: preddf,
                prediction: 'pred',
                target: 'result'
            });
        console.log(score);
        // don't forget to free your model
        booster.free()
    
        // you can save your model in this way
        var model = JSON.stringify(booster); // string
        // or
        var model = booster.toJSON(); // object
    
        // and load it
        var anotherBooster = XGBoost.load(model); // model is an object, not a string
        debugger;
    });
}
init();