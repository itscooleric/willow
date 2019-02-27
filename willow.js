/**
 * ID3 Decision Tree which shall EVOLVE!
 * Can also re-implement CART
 * https://medium.com/deep-math-machine-learning-ai/chapter-4-decision-trees-algorithms-b93975f7a1f1
 */
const util        = require('./util.js'),
      performance = require('perf_hooks').performance,
      calc = {
        /**
         * Caculates entropy
         * @param arr array of objects to look at
         * @param key the key of the object to look at
         * @returns entropy as an integer
         */
        entropy: function getEntropy(arr, key) {
            let il      = arr.length,
                counts  = {},           // counts of different values
                entropy = 0.0,          
                et = arr[0].constructor == Object? xi => xi[key]+'':xi => xi+''; // Extract the value cleanly by converting to string
            // Runs through an array
            for (let i = 0; i < il; i++){
                let v = et(arr[i]);             // clean the value
                if (!counts[v]) counts[v] = 0;  //check if there is a count
                counts[v]++;                    // add to the count
            }
            Object.values(counts).map(v => {
                let p = v/il;
                entropy += (-p*(Math.log2(p)))
            })
            return entropy;
        },
        /**
         * Calculates class entropy for a given array of objects based on an x and y feature name
         * @param {Array} arr array of objects to analyze
         * @param {String} keyx the iv to look at
         * @param {String} keyy the target variable or dv to look at
         */
        centropy: function getClassEntropy(arr, keyx, keyy){
            let op      = {},
                cent    = {},
                // Extract the value cleanly by converting to a string
                ex = arr[0].constructor == Object? xi => xi[keyx]+'':xi => xi+'',
                ey = arr[0].constructor == Object? yi => yi[keyy]+'':yi => yi+'',
                il = arr.length;
            for (let i = 0; i < il; i++) {
                let x = ex(arr[i]),
                    y = ey(arr[i]);
                if (!op[x]) {
                    op[x]   = [];
                    cent[x] = {n: 0};
                }
                op[x].push(y);
                cent[x].n++;
            }
            // Get the entropy for each of the variables
            Object.keys(op).map(v => {
                cent[v].h = calc.entropy(op[v]);
                cent[v].p = cent[v].n/il;
            })
            return cent;
        },
        impurity: function getGINIImpurityIndex(data, fx, fy) {
            //= 1 — P^2(Target=0) — P^2(Target=1)

        },
        gain: function getInformationGain(data, fx, fy, baseEntropy){
            let ht      = baseEntropy || calc.entropy(data, fy),
                hh      = calc.centropy(data, fx, fy),
                gainSum = 0;
            Object.values(hh).map(k => {
                let cur_val = (k.h * k.p);
                ht -= cur_val;
                gainSum += cur_val;
            })
            // console.log(gainSum)
            return ht;
        }
    },
    /**
     * Initialize a decision tree
     */
    tree = function decisionTree(options = {}){
        this.data       = options.data;
        this.target     = options.target;
        this.features   = Object.keys(this.data[0]).filter(a => a != options.target);
        this.entropy    = calc.entropy(this.data, options.target);
        this.nodes      = {};
        this.nodeCount  = 0;
        this.pure       = false,
        this.trained    = false;
    },
    node = function decisionTreeNode(options){
        this.data      = options.data;              // the data for this node to use
        this.tree      = options.tree;              // the tree this node belongs to
        this.children  = {};                        // where the children of the node are
        this.parent    = options.parent  || false;
        this.depth     = options.depth   || 0;
        this.entropy   = options.entropy;           // starting entropy for this node
        this.feature   = options.feature ||'root';  // feature this node was branched on
        this.value     = options.value   ||'root';  // value of the feature of this node
        this.isLeaf    = options.isLeaf  || false;  // if it's a leaf, we won't split
        this.isRoot    = options.isRoot  || false;  // will determine if we need to add it to the nodes 
        this.features  = this.tree.features;
        this.climbed   = options.isRoot || options.isLeaf;
        this.prototype = {};
        if (!options.isRoot){
            // Generate the node id
            let id   = `${this.feature}_${this.value}`,
                tree = this.tree;
            // Add the node to the tree
            if (!this.isRoot) tree.nodes[id] = this;
            console.log(`~~ Starting ${this.isLeaf?'Leaf':'Branch'} at ${this.feature}_${this.value}`)
            switch (this.isLeaf){
                case false:
                    this.branch();
                    break;
                case true:
                    this.leaf();
                    break;
            };
        }
    };
tree.prototype = { 
    // Determine what the variable should be used to split...
    fit: function trainModel(X_train, y_train){
        this.entropy = calc.entropy(this.data, this.target);
        this.nodes.root = new node({
            data   : this.data,
            entropy: this.entropy,
            feature: 'root',
            value  : 'root',
            isRoot : true,
            tree   : this
        });
        this.nodes.root.branch();
    },
    print: function logTreeQuestions(){
        if (this.trained) {
            console.log(this.nodes)
            console.log(`Printing the tree!`)
            // debugger;
            this.nodes.root.print();
            console.log(`Printing complete!`)
        }
        else console.warn('This model has not yet been trained. Please run tree.fit()')
    },
    admire: function admireTreeLeavesToSeeIfItFits() {
        let nBranch = Object.keys(this.nodes).filter(a => !this.nodes[a].climbed);
        if (nBranch.length == 0) {
            console.log('Fitting complete!')
            this.trained = true;
            this.print();
            debugger;
        } else console.log(nBranch.join(', '))
    }
};
node.prototype = {
    print: function printNodeQuestion () {
        let d      = this.depth,
            f      = this.feature,
            v      = this.value,
            e      = this.entropy,
            op     = '==',                                 // operator - more useful later when using continuous variables
            output = [],
            tabs   = new Array(d).join('\t'),
            push   = str => console.log(`${tabs}${str}`);
            // push   = str => output.push(`${tabs}${str}`);
        if (!this.isLeaf){
            let nKids = this.children;
            push(`is ${f} ${op} ${v}? [${e}]`);
            Object.keys(nKids).map(name => nKids[name].print())
        } else {
            let nProbs = this.probs;
            Object.keys(nProbs).map(prob => push(`is ${f} ${op} ${v}? ${nProbs[prob]} ~ ${prob}`))
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
            nValue   = this.value
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
        // TODO: Maybe add a bayesian option
        // TODO: Also add error handling for if people choose something that hasn't been seen
        console.log(`Leaf ${nFeature}_${nValue} at ${nEntropy}:`)
        nValues.map(v => {
            nProbs[v] = tProbs[v]/nLength;
            console.log(`\t${v} ~ ${nProbs[v].percent(2)}`);
        });
        // else this.tree[nBranch].branch();
        // Set up the probabilities of each outcome in this section for when running predict
    },
    branch: function createBranchingNode () {
        let nData     = this.data,
            nValue    = this.value,
            nFeature  = this.feature,
            nFeatures = this.features,
            nEntropy  = this.entropy,
            nDepth    = this.depth,
            gains     = {},
            maxgain   = { gain: 0 },
            t         = this.tree.target;
        // debugger;
        nFeatures.map((f, i) => {
            let curgain = calc.gain(nData, f, t, nEntropy);
            gains[f] = {
                feature: f,
                gain   : curgain,
                i      : i
            };
            maxgain = curgain > maxgain.gain?gains[f]:maxgain;
        })
        let bFeature = nFeatures.splice(maxgain.i, 1)[0],   // the feature the new node will branch on
            bGain    = maxgain.gain,                        // information gain from the current node
            bEntropy = nEntropy - bGain,                     // the starting entropy for the new node
            bData    = {},                                  // the data that will be passed on to the different nodes
            bLeaf    = false;
        /**
         * * Should write the is leaf function here
         * * First check if there is any gain
         * * Then compare to any of the parameters set for the node such as max depth or early stopping
         */
        if (bEntropy == 0) {
            bLeaf = true;
            console.log(`Leafing from ${nFeature}_${nValue} branch @ ${bFeature} gains ${bGain} to ${bEntropy}`)
        }
        if (!bLeaf) console.log(`Branch ${nFeature}_${nValue} branch @ ${bFeature} gains ${bGain} to ${bEntropy}`);
        // Determine how to split it
        // debugger;
        while (nData.length > 0){
            let r = nData.pop(),            // current record in the dataset
                v = r[bFeature];            // value of the bFeature in the current record
            if (!bData[v]) bData[v] = [];   // checks to see if value is represented in bData
            bData[v].push(r);               // Add record to the node data set
        }
        // To make sure that everything has been done
        // debugger;
        Object.keys(bData).map(bValue => {
            console.log(`Should be spawning ${bValue}`)
            this.children[`${bFeature}_${bValue}`] = new node({
                data   : bData[bValue],
                feature: bFeature,
                value  : bValue,           // value is the key of node data
                gain   : bGain,
                entropy: bEntropy,
                tree   : this.tree,
                parent : this.branch,
                depth  : nDepth+1,
                isLeaf : bLeaf
            })
        })
        this.climbed = true;
        this.tree.admire();
    }
};
let d = `sunny, hot, high, weak, no
sunny, hot, high, strong, no
overcast, hot, high, weak, yes
rain, mild, high, weak, yes
rain, cool, normal, weak, yes
rain, cool, normal, strong, no
overcast, cool, normal, strong, yes
sunny, mild, high, weak, no
sunny, cool, normal, weak, yes
rain, mild, normal, weak, yes
sunny, mild, normal, strong, yes
overcast, mild, high, strong, yes
overcast, hot, normal, weak, yes
rain, mild, high, strong, no`.split('\n').map(r => {
    let rs = r.split(', ');
    return {
        outlook    : rs[0],
        temperature: rs[1],
        humidity   : rs[2],
        wind       : rs[3],
        play       : rs[4]
    }
})
// console.log(calc.entropy(d, 'play'));
// console.log(calc.gain(d, 'outlook', 'play'));
// debugger;

let dt = new tree({
    data  : d,
    target: 'play'
});
dt.fit();

