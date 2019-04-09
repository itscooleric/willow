/**
 * Weeping Willows
 * the man himself: http://www.stat.wisc.edu/~loh/treeprogs/
 * 
 * example datasets: http://archive.ics.uci.edu/ml/index.php && ftp://ftp.ics.uci.edu/pub/machine-learning-databases/
 * ml stuff: ftp://ftp.ics.uci.edu/pub/
 * 
 */
const util        = require('./util.js'),
      crit        = require('./crit.js'),
      performance = require('perf_hooks').performance,
    /**
     * Initialize a decision tree
     */
    tree = function decisionTree(options = {}){
        this.data       = options.data;
        this.target     = options.target;
        this.minSplit = options.minSplit || 5,
        this.features   = Object.keys(this.data[0]).filter(a => a != options.target);
        this.entropy    = crit.entropy(this.data, options.target);
        this.nodes      = {};
        this.nodeCount  = 0;
        this.criterion  = options.criterion || 'gini',
        this.pure       = false;
        this.trained    = false;
        this.queue      = [];
        if (this.entropy == 0){
            console.error(`Something interesting has occured, entropy is 0! Could mean there is no target, or that there is nothing to learn`);
            debugger;
        }
    },
    node = function decisionTreeNode(options){
        this.data      = options.data;              // the data for this node to use
        this.tree      = options.tree;              // the tree this node belongs to
        this.children  = {};                        // where the children of the node are
        this.parent    = options.parent  || false;
        this.depth     = options.depth   || 0;
        this.entropy   = crit.entropy(this.data, this.tree.target);//options.entropy;           // starting entropy for this node
        this.feature   = options.feature ||'root';  // feature this node was branched on
        this.value     = options.value   ||'root';  // value of the feature of this node
        this.isRoot    = options.isRoot  || false;  // will determine if we need to add it to the nodes 
        this.isLeaf    = options.isLeaf  || false;  // if it's a leaf, we won't split
        this.features  = this.tree.features;
        this.climbed   = options.isRoot || options.isLeaf;
        this.prototype = {};
        this.criterion = options.criterion || this.tree.criterion;
        this.target    = options.target || this.tree.target;
        this.minSplit  = options.minSplit || this.tree.minSplit;;
        // Only get the best split if it isn't a leaf
        this.split     = !this.isLeaf?this._selectFeature({data: this.data, fy: this.target}):false;
        this.id        = options.id||`${this.feature}_${this.value}`;
        // if (this.value == '<=|0.8') debugger;
        if (this.parent && !this.isLeaf) this.isLeaf =  this.split.score == 1 || this.split.score == 0;
        // if (this.parent && !this.isLeaf) this.isLeaf =  this.parent.split.score == 1 || this.parent.split.score == 0;
        // debugger;
        if (!options.isRoot){
            // Generate the node id
            let id   = this.id,
                tree = this.tree;
            // Add the node to the tree
            if (!this.isRoot) tree.nodes[id] = this;
            this.tree.queue.push(this);
        }
    };
tree.prototype = { 
    // Determine what the variable should be used to split...
    fit: function trainModel(X_train, y_train){
        this.entropy = crit.entropy(this.data, this.target);
        this.nodes.root = new node({
            data   : this.data,
            entropy: this.entropy,
            feature: 'root',
            value  : 'root',
            isRoot : true,
            tree   : this
        });
        if (this.data[0][this.target]) this.nodes.root.branch();
        else {
            console.error('Target variable could not be found! Terminating')
            debugger;
        }
    },
    print: async function logTreeQuestions(){
        this.output = '';
        if (this.trained) {
            console.log(this.nodes)
            console.log(`Printing the tree!`)
            // debugger;
            this.nodes.root.print();
            console.log(this.output);
            await util.write(this.output, 'willow-result.txt');
            console.log(`Printing complete!`);
            console.log(this.nodes.root.children);
            debugger;
            // console.log(this.nodes);
            // debugger;
        }
        else console.warn('This model has not yet been trained. Please run tree.fit()')
    },
    admire: function admireTreeLeavesToSeeIfItFits() {
        if (this.queue.length == 0) {
            console.log('Fitting complete!')
            this.trained = true;
            this.print();
            // debugger;
        } else {
            // can be optimized here using pop instead or an object
            let nextNode = this.queue.shift();
            console.log(`~~ Admiring ${nextNode.isLeaf?'Leaf':'Branch'} at ${nextNode.feature}_${nextNode.value}`)
            switch (nextNode.isLeaf){
                case false:
                    nextNode.branch();
                    break;
                case true:
                    nextNode.leaf();
                    break;
            };
        };
    }
};
node.prototype = {
    print: function printNodeQuestion () {
        let d      = this.depth,
            f      = this.feature,
            v      = this.value,
            e      = this.entropy,
            [feature, op, value] = this.id.split('~'),
            // op     = '==',                                 
            // operator - more useful later when using continuous variables
            output = [],
            tabs   = new Array(d).join('\t'),
            push   = str => this.tree.output += `\n${tabs}${str}`;
        // debugger;
            // push   = str => output.push(`${tabs}${str}`);
        if (!this.isLeaf){
            let nKids = this.children;
            if (!this.isRoot) push(`${feature} ${op} ${value}:`);
            else push(`TREE ROOT\n-------`)
            Object.keys(nKids)
                .sort(a => nKids[a].isLeaf?-1:1)
                .map(name => nKids[name].print())
        } else {
            let nProbs = this.children;
            // Object.keys(nProbs).map(prob => push(`${(+nProbs[prob]*100).toFixed(2)}% ${prob}`))
            push(`${feature} ${op} ${value}:`);
            Object.keys(nProbs).map(prob => push(`\t${+(nProbs[prob].toFixed(2))*100}% ~ ${prob}`))
            // Object.keys(nProbs).map(prob => push(`${feature} ${op} ${value}: ${nProbs[prob]} ~ ${prob}`))
        }
    },
    /**
     * ?Maybe can add a class instead of isLeaf?
     *  with that, nodes could be the base class with subclasses for leafs or another type
     *  operation that isn't split. perhaps could implement different costs or something/get a mixed tree
     */
    leaf  : function createLeafyNode () {
        let nData    = this.data,
            nLength  = nData.length,
            nEntropy = this.entropy,
            nFeature = this.feature,
            nValue   = this.value,
            nProbs   = this.children,
            tProbs   = {},
            nValues  = [],
            target   = this.tree.target;
        for (let i = 0; i < nLength; i++){
            let r = nData[i],
                v = r[target];
            if (!tProbs[v]) {
                tProbs[v] = 0;
                nValues.push(v);
            }
            tProbs[v]++;
        };
        console.log(`Leaf ${nFeature}~${nValue} at ${nEntropy}:`)
        nValues.map(v => {
            nProbs[v] = tProbs[v]/nLength;
            console.log(`\t${v} ~ ${nProbs[v].percent(2)}`);
        });
        this.tree.admire();
    },
    _selectFeature: function (options = {}) {
        let criterion = this.criterion,
            data      = options.data || this.data,
            best      = crit[criterion]({
                data  : data,
                target: this.target,
                min   : options.minSplit || this.minSplit
            }),
            leaf = best.score == 0;
        return Object.assign(best, {leaf});
    },
    // _stoppingCriteria = function () {

    // },
    branch: function createBranchingNode (options = {}) {
        let nData     = this.data,
            nValue    = this.value,
            nFeature  = this.feature,
            nDepth    = this.depth,
            split     = this.split,
            bFeature  = split.feature,         // the feature the new node will branch on
            bData     = {},                    // the data that will be passed on to the different nodes
            bLeaf     = split.leaf,
            bValues   = [],
            groupData   = this.criterion == 'gain'?crit.group({data: nData, feature: bFeature}):
                                            crit.group({data: nData, feature: bFeature, value: split.value, op: '<='})
        // Faster method... but harder to keep track of
        let manual = () => {
            let tData = nData.slice(0);
            while (tData.length > 0){
                let r = tData.pop(),            // current record in the dataset
                    v = r[bFeature];            // value of the bFeature in the current record
                if (!bData[v]) {
                    bData[v] = [];              // checks to see if value is represented in bData
                    bValues.push(v);
                }
                bData[v].push(r);               // Add record to the node data set
            };
        };
        // debugger;
        groupData.values.map(bv => {
            // console.log(`Should be spawning ${bv}`);
            // let bEntropy = crit.entropy(bData[bv], t),
            //     bLeaf    = bEntropy == 0;
            let bvSplit = bv.split('|'),
                bvOp    = bvSplit[0],
                bvVal   = bvSplit[1],
                bvKey   = `${bFeature}~${bvOp}~${bvVal}`;
            console.log(`New ${bLeaf?'Leaf':'Branch'} from ${nFeature}~${nValue} to ${bvKey}`);
            this.children[bvKey] = new node({
                data   : groupData.data[bv],
                feature: bFeature,
                value  : bv,
                id     : bvKey,
                // value is the key of node data
                tree   : this.tree,
                parent : this,
                depth  : nDepth+1,
                isLeaf : bLeaf
            })
        })
        this.climbed = true;
        this.tree.admire();
    }
};
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
    // let pickSplit = () => crit.bestSplitFeature(Object.assign({
    //     feature: 'petal_length',
    //     data   : sample.iris.data,
    //     target : sample.iris.target,
    //     min    : 5
    // }));
    // console.log(profiler(() => pickSplit(), 10000))
    // debugger;
    sample.iris.data.parseInt();
    let ft = crit.bestSplitFeature(Object.assign({
        feature: 'petal_width',
        data   : sample.iris.data,
        target : sample.iris.target,
        // debug  : true
        // min    : 5
    }))
    console.log(ft);
    // new tree(Object.assign({criterion: 'gain'}, sample.weather)).fit()
    // debugger;
    // sample.iris.data.parseInt();
    new tree(sample.iris).fit()
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

