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
        credit: {
            data  : await util.read('./sklearn/credit/credit.csv'),
            target: 'class'
        },
        mushroom: {
            data  : await util.read('./sklearn/mushroom/mushroom.csv'),
            target: 'class'
        },
    };
    // let m1 = () => crit.entropy(sample.credit.data, 'class') == 0,
    //     m2 = () => sample.credit.data.options('class').length == 1;
    
    // // console.log('Original Method');
    // // for (let i = 0; i < 10; i++) console.log(util.speed(m1, 10000))
    // // debugger;
    // console.log('New Method');
    // for (let i = 0; i < 10; i++) console.log(util.speed(m2, 10000))
    // debugger;

    // let originalMethod = (options = {}) => {
    //     var data = options.data || 'data',
    //         water = options.water || 'water',
    //         monkey = options.monkey || 'monkey',
    //         buffalo = options.buffalo || 'buffalo',
    //         falco = options.falco || 'falco';
    //     return {data, water, monkey, buffalo, falco}
    // },
    // newMethod = (options = {}) => {
    //     var data    = util.default(options.data, 'data'),
    //         water   = util.default(options.water, 'water'),
    //         monkey  = util.default(options.monkey, 'monkey'),
    //         buffalo = util.default(options.buffalo, 'buffalo'),
    //         falco   = util.default(options.falco, 'falco');
    //     return {data, water, monkey, buffalo, falco}
    // };
    // console.log('Original Method');
    // for (let i = 0; i < 10; i++) console.log(util.speed(originalMethod, 10000))
    // debugger;
    // console.log('New Method');
    // for (let i = 0; i < 10; i++) console.log(util.speed(newMethod, 10000))
    // debugger;
    
    // sample.credit.data.parseInt(['a01', 'a02','a03', 'a08', 'a11', 'a14', 'a15']);
    // sample.credit.data.dropNA();
    // console.log(sample.credit.data[0])
    var will = await new willow.tree({
        minSplit: 5,
        maxDepth: 5,
        data    : sample.mushroom.data,
        target  : sample.mushroom.target
    }).fit();
    console.log(will);
    let json = await will.save();
    await util.write(json, 'will-test.json')

    // let sklearn =await  boss.python.run('sklearn/tree_example.py', '', msg => { // can add back after rmeoval of chalk watermelon
    //     boss.pylog(msg);
    // })

    // let will2 = await willow.load(await util.read('will-test.json'));
    // await will2.fit({
    //     minSplit: 3,
    //     data    : sample.mushroom.data,
    //     target  : sample.mushroom.target
    // })
    
    let res = await will.predict(sample.mushroom.data),
        score = await will.score();
    // Okay testing expand
    // console.log('Testing expansion!')
    // console.log(res[0])
    // res.expand()
    // console.log('After Expansion:')
    // console.log(res[0])
    await res.write('ValidatingScores.csv')
    
    let ess = ['ppv', 'auc','tp', 'fp','tn', 'fn'],
        esx = Object.values(score).map(a => ess.map(b => `${b}: ${a[b]}`).join('\n')).join('\n\n');
    console.log(esx);
    debugger;
}
init();