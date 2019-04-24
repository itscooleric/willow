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
      e = {};
    /**
     * Initialize a decision tree
     */
e.tree = function decisionTree(options = {}){
    this.data      = options.data || [];
    this.target    = options.target || false;
    this.minSplit  = options.minSplit || 5;
    this.maxDepth  = options.maxDepth || false;
    let target = this.target;
    try {
        // console.log(this.data[0]);
        this.features  = this.features || options.features || [];
        if (this.data.length > 0 && this.features.length == 0) this.features = Object.keys(this.data[0]).filter(a => a != target);
    } catch (err){
        console.error(err);
        debugger;
    }
    // this.entropy   = crit.entropy(this.data, options.target);
    this.nodes     = options.nodes || [];
    this.nodeCount = options.nodeCount || 0;
    this.criterion = options.criterion || 'gini';
    this.pure      = options.pure || false;
    this.trained   = options.trained || false;
    this.queue     = options.queue || [];
    if (this.entropy == 0){
        console.error(`Something interesting has occured, entropy is 0! Could mean there is no target, or that there is nothing to learn`);
        debugger;
    }
    return this;
};

e.node = function decisionTreeNode(options, queueSplit = true){
    this.data     = options.data;              // the data for this node to use
    // if (this.data) debugger;
    // if (queueSplit) debugger;
    this.tree     = options.tree;              // the tree this node belongs to
    this.children = options.children || {};                        // where the children of the node are
    this.parent   = options.parent  || false;
    // this.id       = this.tree.nodeCount;
    // this.tree.nodeCount++;
    this.depth     = options.depth   || 0;
    // this.entropy   = crit.entropy(this.data, this.tree.target);  //options.entropy;           // starting entropy for this node
    this.feature   = options.feature ||'root';                   // feature this node was branched on
    this.value     = options.value   ||'root';                   // value of the feature of this node
    this.isRoot    = options.isRoot  || false;                   // will determine if we need to add it to the nodes
    this.isLeaf    = options.isLeaf  || false;                   // if it's a leaf, we won't split
    this.op        = options.op      || '<=';
    this.features  = this.tree.features;
    this.climbed   = options.isRoot  || options.isLeaf;
    this.prototype = {};
    this.criterion = options.criterion || this.tree.criterion;
    this.target    = options.target    || this.tree.target;
    this.minSplit  = options.minSplit  || this.tree.minSplit;
    this.split     = options.split|| false;
    if (queueSplit){
        if (!this.data) debugger;
        // Only get the best split if it isn't a leaf
        if (!this.split && !this.isLeaf) this.split = this._selectFeature({data: this.data, fy: this.target});
        // this.id        = options.id||`${this.feature}_${this.value}`;
        // if (this.value == '<=|0.8') debugger;
        // THIS IS THE CURSED LINE!!!
        if (!this.isRoot && !this.isLeaf) this.isLeaf =  this.split.score == 1 || this.split.score == 0;
        // if (this.parent && !this.isLeaf) this.isLeaf =  this.parent.split.score == 1 || this.parent.split.score == 0;
        // debugger;
        if (!options.isRoot){
            // Generate the node id
            let id   = this.id,
                tree = this.tree;
            // Add the node to the tree
            if (!this.isRoot) tree.nodes.push(this);
            else this.tree.root = this;
        }
        this.tree.queue.push(this);
    }
    return this;
};

e.load = async function(json) {
    try {
        console.log(`Loading model from JSON!`)
        // this function will return a new Tree from a JSON model
        let model = json.constructor == String?JSON.parse(json):json,
            tree  = new e.tree(model);
        // Object.assign(tree, model);
        tree.nodes.splice(0).map(a => {
            a.tree = tree;
            a = new e.node(a, false);
            // Give them their homes back
            // a.tree = tree;
            // Give them their children back
            if (a.feature == 'root') tree.root = a;
            Object.keys(a.children).map(b => a.children[b].parent = a);
        });
        return tree;
    } catch (err) {
        console.error(err.stack);
        debugger;
        return err;
    }
}
/**
 * Saves a model 
 *
 * @param {*} model tree model to be saved
 * @param {boolean} [keepData=false] whether or not to preserve the data within the exported model
 * @returns String of JSON containing the complete model
 */
e.save = async function saveToJSON(model, keepData = false) {
    try {
        // This function will return JSON string of the model...
        let tempObj = {...model},
            delKeys = keepData?['parent', 'tree']:['parent', 'tree', 'data'],
            emptobj = {};
        delKeys.map(a => emptobj[a] = [])
        if (!keepData) tempObj.data - [];
        delKeys.map(a => delete tempObj[a]);

        // tempObj.nodes = tempObj.nodes.slice(0);
        tempObj.nodes = tempObj.nodes.slice(0).concat(model.root);

        tempObj.nodes.map(a => {
            Object.assign(a, emptobj)
            delete a.protptype;
            // delKeys.map(b => delete a[b])
        });
        console.log(model);
        console.log(tempObj);
        // debugger;
        return JSON.stringify(tempObj);
    } catch (err){
        console.error(err);
        debugger;
        return err;
    }
}
e.tree.prototype = {
    // Determine what the variable should be used to split...
    fit: async function trainModel(options = {}){
        if (options.constructor == Array){
            // Options is a dataset
            this.data = options;
        } else {
            // Options object
            Object.keys(options).map(a => this[a] = options[a]);
        }
        if (this.data.length > 0){
            this.classes = this.data.options(this.target);
            this.nodes = [];
            if (this.criterion == 'gain') this.entropy = crit.entropy(this.data, this.target);
            this.root = new e.node({
                data   : this.data,
                entropy: this.entropy,
                feature: 'root',
                value  : 'root',
                isRoot : true,
                tree   : this
            });
            if (this.data[0][this.target]) this.root.branch();
            else {
                console.error('Target variable could not be found! Terminating')
                debugger;
            }
            return this;
        } else {
            return new Error('This tree has no data');
        }
    },
    print: async function logTreeQuestions(){
        this.output = '';
        if (this.trained) {
            console.log(this.nodes)
            console.log(`Printing the tree!`)
            // debugger;
            this.root.print();
            console.log(this.output);
            await util.write(this.output, 'willow-result.txt');
            console.log(`Printing complete!`);
            console.log(this.root.children);
            // debugger;
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
            // switch (!nextNode.isLeaf){
            switch (!nextNode.isLeaf && (!nextNode.tree.maxDepth || nextNode.tree.maxDepth >= nextNode.depth)){
                case true:
                    nextNode.branch();
                    break;
                case false:
                    nextNode.leaf();
                    break;
            };
        };
    },
    /**
     * Takes input and runs it through the tree to arrive at an output
     * Internal function not to be called outside of the predict functions
     */
    route: async function(input) {
        // Start at the root of the tree
        let curNode     = this.root,
            // To determine if a leaf node has been reached
            reachedLeaf = false;
        while (!reachedLeaf){ 
                // If the next of kin has been found
            let foundKid = false,
                // Names of the kids that are options
                roster = Object.keys(curNode.children);
            // While there isn't a kid and there are kids left
            for (let i = 0, il = roster.length; i < il && !foundKid; i++){
                // getting more info on the current kid based on the name
                let kid = curNode.children[roster[i]];
                // check if the value of the kid is inline with the value of the input
                if (crit.compare(input[kid.feature], kid.value, kid.op)){
                    // End the search and move down the tree, potentially end the search of this kid is a true heir to the iron throne
                    foundKid    = true;
                    reachedLeaf = kid.isLeaf;
                    curNode     = kid;
                }
            }
        };
        let ret = {},
            fam = curNode.children,
            sumValues = Object.values(fam).reduce((a, b) => a + b.proba, 0);
            /**
             * TODO OptimizeMe Watermelon -- maybe make it calculate all options at leaf()
             */
        this.classes.map(a => ret[a] = {willobability: fam[a]?fam[a].willobability:1-sumValues, willowiction: a});
        // console.log(Object.values(ret).map(a => a.proba))
        // options.map(a => best = fam[a] > best?  fam[a]: best);
        // console.log(best);
        // console.log(`Has ${best.proba.percent()}% chance of being ${best.value}`);
        return ret;
    },
    /**
     * Takes single input and predicts the output
     * @param {Object|Array} input the object or array to be used for prediction
     * @result returns the value of the prediction
     */
    predictOne: async function(input, validateColumns = true){
        try {
            switch (input.constructor){
                case Array:
                    return this.predict(input);
                case Object:
                    // Original column validation method reponds on the first missing feature -- faster
                    // if (validateColumns){
                    //     for (let i = 0, il = this.features.length; i < il; i++){
                    //         let f = this.features[i];
                    //         if (!input[f]) return new Error(`Predict input is missing feature "${f}"`)
                    //     }
                    //     return this.route(input);
                    // }
                    // Fancier validation method which includes all missing features -- for the more complete philosophy
                    if (validateColumns){
                        // Missing features
                        let mf = [];
                        for (let i = 0, il = this.features.length; i < il; i++){
                            let f = this.features[i];
                            if (!input[f]) mf.push(f);
                        }
                        if (!mf[0]) return this.route(input);
                        else return new Error(`Predict input is missing feature${mf[1]?'s':''}: ${mf.map(a => "'"+a+"'").join(', ')}`)
                    }
                    else return this.route(input);
                default:
                    return new Error('What is this data type?!');
            }
        } catch (err) {
            return err;
        }
    },
    predict: async function(input, withInput = true){
        let result = [];
        try {
            switch (input.constructor){
                case Object:
                    return this.predictOne(input);
                case Array:
                    for (let i = 0, il = input.length; i < il; i++){
                        let po = await this.predictOne(input[i]),
                            rpo = withInput?Object.assign({}, input[i], po):po;
                        result.push(rpo);
                    }
                    return result;
                default:
                    return new Error('What is this data type?!');
            }
        } catch (err) {
            return err;
        }
    },
    save: function (keepData = false){
        return e.save(this, keepData)
    },
    /**
     * TODO!!! WATERMELON!!!
     * Check JS eval scores against python eval scores
     * Add importances
     * Add parameter tuning
     * @param {*} options 
     */
    score: async function getPerformanceInfoAboutModel(options = {}){
        try {
            let dataset, threshold;
            switch (options.constructor){
                case Object:
                    dataset = options.data || this.data;
                    threshold = options.threshold || .5;
                    break;
                case Number:
                    dataset = this.data;
                    threshold = options;
                    break;
                case Array:
                    dataset = options;
                    threshold = .5;
                    BroadcastChannel;
            }
            // demster shafer to calculate uncertainty
            let result  = {},
                allPred = (await this.predict(dataset)),
                il      = allPred.length,
                target  = this.target,
                classes = this.classes.slice(0);
            classes.map(a => result[a] = {auc: 0, tp: 0, fp: 0, tn: 0, fn: 0, p: 0, n: 0, t: 0, f: 0})
            while (classes.length > 0){
                let curClass = classes.pop(),
                    pred = allPred.map((a, i) => Object.assign({}, dataset[i], a[curClass])).sort((a, b) => a.willobability >= b.willobability? -1:1),
                    r        = result[curClass],
                    tfalse   = 0;
                // WATERMELON TODO NOT PICKING UP POSITIVES FIXME
                for (let i = 0; i < il; i++){
                    let predProb = pred[i].willobability,
                        actuRes  = pred[i][target] == pred[i].willowiction?1:0,
                        // Is value equal to the class we're looking at
                        pos_neg = predProb >= threshold?'p':'n',
                        // Is the prediction accurate
                        tru_fal = predProb == actuRes?'t':'f';
                    if (predProb > 0) debugger;
                    r[tru_fal+pos_neg]++;
                    r[tru_fal]++;
                    r[pos_neg]++;
                    tfalse += (1 - predProb);
                    r.auc += predProb * tfalse;
                }
                // Calculations for after the run! Source https://en.wikipedia.org/wiki/Confusion_matrix
                r.auc /= tfalse * (il - tfalse);
                // True Positive Rate / Sensitivity / Recall / Hit Rate (TPR)
                r.tpr = r.tp/r.p;
                // Miss Rate / False Negative Rate
                r.fnr = 1 - r.tpr;
                // True Negative Rate / Specificity / Selectivity (TNR)
                r.tnr = r.tn/r.n;
                // False Positive Rate / Fall-Out 
                r.fpr = 1 - r.tnr;
                // Precision / Positive Predictive Value (PPV)
                r.ppv = r.tp/ (r.tp+ r.fp);
                // False Discovery Rate (FDR)
                r.fdr = 1 - r.ppv;
                // Negative Predictive Value (NPV)
                r.npv = r.tn/(r.tn+r.fn)
                // False Omission Rate (FOR)
                r.for = 1 - r.npv;
                // ----- Even Deeper ---------//
                // Accuracy (ACC)
                r.acc = (r.tp + r.tn)/(r.p + r.n)
                // F1 / Harmonic Mean of Precision and Sensitivity
                r.f1 = 2 * r.tp / (2 * r.tp + r.fp + r.fn)
                // Matthews Correlation Coefficient (MCC) - https://en.wikipedia.org/wiki/Matthews_correlation_coefficient
                r.mcc = (r.tp * r.tn - r.fp * r.fn)/ Math.sqrt((r.tp + r.fp) * (r.tp+r.fn) * (r.tn+r.fp) * (r.tn+r.fn))
                // Informedness / Bookmarker Informedness (BM)
                r.bm = r.tpr + r.tnr - 1;
                // Markedness (MK) 
                r.mk = r.ppv + r.npv - 1;

                // auc assign more to the positive - randomly picking pair and model picks correctly
                // should alwaus assign more to positive
                // sort ascending
                // get false probas and add true * false to auc
            };
            return result;
        } catch (err){
            console.error(err.stack);
            return err;
        }
    }
    // save: async function saveToJSON(){
    //     let tempNodes = {},
    //         nodeQueue = this.nodes.map(a => a.id),
    //         extract = function extractNodeInformation(nodeId){
    //             let node = this.nodes.find(a => a.id == nodeId),
    //                 tobj = {
    //                     feature: node.feature,
    //                     value  : node.value,
    //                     op     : node.op,
    //                     kids   : node.children.map(a => a.id),
    //                     root   : node.isRoot
    //                 };
    //             return tobj;
    //         };
    //     // Add all of the nodes to the tempNodes object
    //     nodeQueue.map(n => tempNodes[n.id] = extract(n))
    //     // Add of their children to the object
    //     nodeQueue.map(n => pickup(n))
    //     let ret = {
    //         nodes    : tempNodes,
    //         features : this.features,
    //         criterion: this.criterion,
    //         minSplit : this.minSplit,
    //         maxDepth : this.maxDepth
    //     };
    //     return JSON.stringify(ret);
    // },
    // load: async function loadFromJSON(treeObj){
    //     // To be run after they're all added to tempNodes
    //     let pickup = function addChildrenToNodes(nodeId) {
    //             let node = tempNodes[nodeId];
    //             node.children = {};
    //             node.kids.map(a => node.children[a] = tempNodes[a]);
    //             delete nd.kids;
    //         },
    //         nodeQueue = Object.keys(treeObj.nodes);
    //     this.nodes = 1;
    //     // SHIT... maybe one should just remove the tree and parents then export
    //     // then add the tree and parents back....


    // }
};
e.node.prototype = {
    print: function printNodeQuestion () {
        let d       = this.depth,
            feature = this.feature,
            value   = this.value,
            op      = this.op,
            // [feature, op, value] = this.id.split('~'),
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
            Object.keys(nProbs).map(prob => push(`\t${+(nProbs[prob].proba.toFixed(2))*100}% ~ ${prob}`))
            // Object.keys(nProbs).map(prob => push(`${feature} ${op} ${value}: ${nProbs[prob]} ~ ${prob}`))
        }
    },
    /**
     * ?Maybe can add a class instead of isLeaf?
     *  with that, nodes could be the base class with subclasses for leafs or another type
     *  operation that isn't split. perhaps could implement different costs or something/get a mixed tree
     */
    leaf: function createLeafyNode () {
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
        // console.log(`Leaf ${nFeature} ${nValue}:`)
        nValues.map(v => {
            nProbs[v] = {
                value: v,
                proba: tProbs[v]/nLength
            };
            console.log(`\t${v} ${this.op} ${nValue} ~ ${nProbs[v].proba.percent(2)}`);
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
            bValues   = [];
        if (!nData) debugger;
        let groupData   = this.criterion == 'gain'?crit.group({data: nData, feature: bFeature}):
                                            crit.group({data: nData, feature: bFeature, value: split.value, op: this.op})
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
        let tTree   = this.tree,
            tParent = this,
            tKids   = this.children;
        Object.values(groupData).map(bv =>{
            let bvKey   = `${bFeature}~${bv.op}~${bv.value}`;
            // console.log(`New ${bLeaf?'Leaf':'Branch'} from ${nFeature}~${bv.value} to ${bvKey}`);
            tKids[bvKey] = new e.node({
                data   : bv.data,
                feature: bFeature,
                value  : bv.value,
                id     : bvKey,
                op     : bv.op,
                // value is the key of node data
                tree   : tTree,
                parent : tParent,
                depth  : nDepth+1,
                isLeaf : bLeaf
            });
        });
        this.climbed = true;
        this.tree.admire();
    }
};
module.exports = e;