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
    }
    this.tree.queue.push(this);
    return this;
};
e.load = async function(txt) {
    try {
        // this function will return a new Tree from a JSON model
        let model = txt.constructor == String?JSON.parse(txt):txt,
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
    route: async input => {
        let curNode     = this.root,
            reachedLeaf = false;
        while (!reachedLeaf){
            let foundKid = false,
                roster = Object.keys(curNode.children);
            for (let i = 0, il = roster.length; i < il && !foundKid; i++){
                let kid = curNode.children[roster[i]];
                if (crit.compare(input[kid[feature]], kid[value], kid.op)){
                    foundKid    = true;
                    reachedLeaf = kid.isLeaf;
                    curNode     = kid;
                }
            }
        };
        // So now we are at a leaf...

    },
    predictOne: async (input, validateColumns = true) => {
        try {
            switch (input.constructor){
                case Array:
                    return this.predict(input);
                case Object:
                    if (validateColumns){
                        let missingFeature = false;
                        for (let i = 0, il = this.features.length; i < il && !missingFeature; i++){
                            let f = this.features[i];
                            if (!input[f]) missingFeature = true;
                        }
                        if (!missingFeature) return this.route(input);
                        else return new Error('Some feature is missing! TODO: Report what feature')
                    }
                    else return this.route(input);
                default:
                    return new Error('What is this data type?!');
            }
        } catch (err) {
            return err;
        }
    },
    predict: async input => {
        let result = [];
        try {
            switch (input.constructor){
                case Object:
                    return this.predictOne(input);
                case Array:

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
        // console.log(`Leaf ${nFeature} ${nValue}:`)
        nValues.map(v => {
            nProbs[v] = tProbs[v]/nLength;
            console.log(`\t${v} ${this.op} ${nValue} ~ ${nProbs[v].percent(2)}`);
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
        groupData.values.map(bv => {
            // console.log(`Should be spawning ${bv}`);
            // let bEntropy = crit.entropy(bData[bv], t),
            //     bLeaf    = bEntropy == 0;
            let bvSplit = bv.split('|'),
                bvOp    = bvSplit[0],
                bvVal   = bvSplit[1],
                bvKey   = `${bFeature}~${bvOp}~${bvVal}`;
            console.log(`New ${bLeaf?'Leaf':'Branch'} from ${nFeature}~${nValue} to ${bvKey}`);
            this.children[bvKey] = new e.node({
                data   : groupData.data[bv],
                feature: bFeature,
                value  : bvVal,
                id     : bvKey,
                op     : bvOp,
                // value is the key of node data
                tree   : this.tree,
                parent : this,
                depth  : nDepth+1,
                isLeaf : bLeaf
            });
        });
        this.climbed = true;
        this.tree.admire();
    }
};
module.exports = e;