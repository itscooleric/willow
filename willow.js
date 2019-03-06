/**
 * Weeping Willows
 * 
 * example datasets: http://archive.ics.uci.edu/ml/index.php && ftp://ftp.ics.uci.edu/pub/machine-learning-databases/
 * ml stuff: ftp://ftp.ics.uci.edu/pub/
 * 
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
        gini: function getGINIImpurityIndex(data, fx, fy) {
            // Example: https://sefiks.com/2018/08/27/a-step-by-step-cart-decision-tree-example/
            // Both types: https://medium.com/deep-math-machine-learning-ai/chapter-4-decision-trees-algorithms-b93975f7a1f1
            // Parameters: https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html#sklearn.tree.DecisionTreeClassifier

            // WATERMELON RESUME HERE!
            // Gini = 1 – Σ (Pi)2 for i=1 to number of classes
            // Gini(Outlook=Sunny) = 1 – (2/5)2 – (3/5)2 = 1 – 0.16 – 0.36 = 0.48
            // Gini(Outlook=Overcast) = 1 – (4/4)2 – (0/4)2 = 0
            // Gini(Outlook=Rain) = 1 – (3/5)2 – (2/5)2 = 1 – 0.36 – 0.16 = 0.48
            // Then, we will calculate weighted sum of gini indexes for outlook feature.
            // Gini(Outlook) = (5/14) x 0.48 + (4/14) x 0 + (5/14) x 0.48 = 0.171 + 0 + 0.171 = 0.342
            let hg   = {},
                xArr = [];
            for (let i = 0, il = data.length; i < il; i++){
                let a = data[i],
                    vx = a[fx],
                    vy = a[fy];
                if (!hg[vx]) {
                    hg[vx] = {sum: 0};
                    xArr.push(vx);
                }
                if (!hg[vx][vy]) hg[vx][vy] = 0;
                hg[vx].sum++;
                hg[vx][vy]++;
            }
            xArr.map(vx => {
                
            })
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
            return ht;
        },
        compare: function compareValues(val1, val2, type = '=='){
            switch(type){
                case '<=':
                    return val1 <= val2;
                case '>=':
                    return val1 >= val2;
                case '<':
                    return val1 < val2;
                case '>':
                    return val1 > val2;
                default:
                    return val1 == val2;
            }
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
        this.entropy   = calc.entropy(this.data, this.tree.target);//options.entropy;           // starting entropy for this node
        this.feature   = options.feature ||'root';  // feature this node was branched on
        this.value     = options.value   ||'root';  // value of the feature of this node
        this.isLeaf    = options.isLeaf  || false;  // if it's a leaf, we won't split
        this.isRoot    = options.isRoot  || false;  // will determine if we need to add it to the nodes 
        this.features  = this.tree.features;
        this.climbed   = options.isRoot || options.isLeaf;
        this.prototype = {};
        this.id        = `${this.feature}_${this.value}`;
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
        this.entropy = calc.entropy(this.data, this.target);
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
            let nextNode = this.queue.pop();
            console.log(`~~ Starting ${nextNode.isLeaf?'Leaf':'Branch'} at ${nextNode.feature}_${nextNode.value}`)
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
            op     = '==',                                 // operator - more useful later when using continuous variables
            output = [],
            tabs   = new Array(d).join('\t'),
            push   = str => this.tree.output += `\n${tabs}${str}`;
            // push   = str => output.push(`${tabs}${str}`);
        if (!this.isLeaf){
            let nKids = this.children;
            if (!this.isRoot) push(`${f} ${op} ${v}:`);
            else push(`TREE ROOT\n-------`)
            Object.keys(nKids)
                .sort(a => nKids[a].isLeaf?-1:1)
                .map(name => nKids[name].print())
        } else {
            let nProbs = this.children;
            // Object.keys(nProbs).map(prob => push(`${(+nProbs[prob]*100).toFixed(2)}% ${prob}`))

            Object.keys(nProbs).map(prob => push(`${f} ${op} ${v}: ${nProbs[prob]} ~ ${prob}`))
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
        console.log(`Leaf ${nFeature}_${nValue} at ${nEntropy}:`)
        nValues.map(v => {
            nProbs[v] = tProbs[v]/nLength;
            console.log(`\t${v} ~ ${nProbs[v].percent(2)}`);
        });
        this.tree.admire();
    },
    _selectFeature: function selectFeatureToSplitOn(nData =  this.data, nFeatures = this.features, nEntropy = this.entropy, target = this.tree.target) {
        let maxgain = {gain: 0},
            gains = {};
        if (nData.length > 0){
            console.log(`Selecting feature from ${nFeatures.join(', ')}`)
            nFeatures.map((f, i) => {
                console.log(f);
                let curgain = calc.gain(nData, f, target, nEntropy);
                gains[f] = {
                    feature: f,
                    gain   : curgain,
                    i      : i
                };
                maxgain = curgain > maxgain.gain?gains[f]:maxgain;
            })
        } else console.log(`No data for ${this.id}, must be a leaf`);
        return maxgain;
    },
    branch: function createBranchingNode (options = {}) {
        let nData     = this.data,
            nValue    = this.value,
            nFeature  = this.feature,
            nDepth    = this.depth,
            t         = this.tree.target,
            maxgain   = this._selectFeature();
        let bFeature  = maxgain.feature,        // the feature the new node will branch on
            bGain     = maxgain.gain,           // information gain from the current node
            bData     = {},                     // the data that will be passed on to the different nodes
            bValues   = [];
        while (nData.length > 0){
            let r = nData.pop(),            // current record in the dataset
                v = r[bFeature];            // value of the bFeature in the current record
            if (!bData[v]) bData[v] = [];   // checks to see if value is represented in bData
            bData[v].push(r);               // Add record to the node data set
            bValues.push(v);
        };
        bValues.map(bv => {
            console.log(`Should be spawning ${bv}`);
            let bEntropy = calc.entropy(bData[bv], t),
                bLeaf    = bEntropy == 0;
            console.log(`${bLeaf?'Leaf':'Branch'}ing from ${nFeature}_${nValue} branch @ ${bFeature} gains ${bGain} to ${bEntropy}`);
            this.children[`${bFeature}_${bv}`] = new node({
                data   : bData[bv],
                feature: bFeature,
                value  : bv,
                // value is the key of node data
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
    }
    new tree(sample.weather).fit()
}
init();

