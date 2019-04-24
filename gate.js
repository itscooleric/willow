/**
 * Just a javascript file for running tests in willow so I'm  not writing
 * a bunch of test code at the bottom
 * 
 * NEXT STEPS!
 *      Predict Function
 *      Evaluation Metrics
 *      Export/Pickle Function
 * 
 * Later
 *      Importance
 *      Export Image
 *      Documentation
 */
var willow      = require('./willow.js'),
    util        = require('./util.js'),
    crit        = require('./crit_rb.js'),
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
    let sample = {
        weather: {
            data: `sunny, hot, high, weak, no\nsunny, hot, high, strong, no\novercast, hot, high, weak, yes\nrain, mild, high, weak, yes\nrain, cool, normal, weak, yes\nrain, cool, normal, strong, no\novercast, cool, normal, strong, yes\nsunny, mild, high, weak, no\nsunny, cool, normal, weak, yes\nrain, mild, normal, weak, yes\nsunny, mild, normal, strong, yes\novercast, mild, high, strong, yes\novercast, hot, normal, weak, yes\nrain, mild, high, strong, no`.split('\n').map(r => {
                let rs = r.split(', ');
                return {
                    outlook    : rs[0],
                    temperature: rs[1],
                    humidity   : rs[2],
                    wind       : rs[3],
                    play       : rs[4]
                }
            }),
            target: 'play'
        },
        vote: {
            data  : await util.read('./examples/vote/train.csv'),
            target: 'class'
        },
        vowel: {
            data  : await util.read('./examples/cars_etc/vowel.csv'),
            target: 'class'
        },
        lenses: {
            data  : await util.read('./examples/cars_etc/lenses.csv'),
            target: 'lense'
        },
        iris: {
            data  : await util.read('./sklearn/iris/iris.csv'),
            target: 'class'
        },
    }
    sample.iris.data.parseInt();
    let ft = crit.bestSplitFeature(Object.assign({
        feature: 'petal_width',
        data   : sample.iris.data,
        target : sample.iris.target,
        // debug  : true
        min    : 5
    }))
    // console.log(ft);
    // let goodRun = require('./willow_rb.js');
    // var will = await new willow.tree({
    //     minSplit: 5,
    //     data    : sample.iris.data,
    //     target  : sample.iris.target
    // }).fit();
    // console.log(will);
    // let json = await will.save();
    // await util.write(json, 'will-test.json')
    let will2 = await willow.load(await util.read('will-test.json'));
    await will2.fit({
        minSplit: 5,
        data    : sample.iris.data,
        target  : sample.iris.target
    })
    // console.log(will2);
    // will2.print();
    let test = JSON.parse(JSON.stringify(sample.iris.data[0]));
    console.log(`Class is ${test.class}`);
    // delete test.class;
    // delete test.petal_length;
    // delete test.sepal_length;
    // let sklearn =await  boss.python.run('sklearn/tree_example.py', '', msg => { // can add back after rmeoval of chalk watermelon
    //     boss.pylog(msg);
    // })
    let res = await will2.predict(sample.iris.data),
        score = await will2.score();
    console.log(score);
    debugger;
    // let sampleKeys = ['outlook', 'humidity', 'temperature', 'wind'];
    // console.log(`Multiple`)
    // console.log(profiler(() => sampleKeys.map(a => crit.gini(sample.weather.data,a, 'play')), 1000000));
    // console.log(`\nOptimized`);
    // console.log(profiler(() => crit.giniOptimized(sample.weather.data, 'play'), 1000000));
    // // crit.giniOptimized(sample.weather.data, 'play');
    // debugger;
    // new tree(sample.weather).fit()
}
init();