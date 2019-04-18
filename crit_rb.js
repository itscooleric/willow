/**
 * Weeping Willows Criterion Functions
 * Really just split out because it was getting too hot
 * 
 * 
 */
const  calc = {
        /**
         * Caculates entropy
         * @param arr array of objects to look at
         * @param key the key of the object to look at
         * @returns entropy as an integer
         */
        entropy: function getEntropy(arr, key) {
            let il = arr.length,
                counts = {},           // counts of different values
                entropy = 0.0,
                et = arr[0].constructor == Object ? xi => xi[key] + '' : xi => xi + ''; // Extract the value cleanly by converting to string
            // Runs through an array
            for (let i = 0; i < il; i++) {
                let v = et(arr[i]);             // clean the value
                if (!counts[v]) counts[v] = 0;  //check if there is a count
                counts[v]++;                    // add to the count
            }
            Object.values(counts).map(v => {
                let p = v / il;
                entropy += (-p * (Math.log2(p)))
            })
            return entropy;
        },
        /**
         * Calculates class entropy for a given array of objects based on an x and y feature name
         * @param {Array} arr array of objects to analyze
         * @param {String} keyx the iv to look at
         * @param {String} keyy the target variable or dv to look at
         */
        centropy: function getClassEntropy(arr, keyx, keyy) {
            let op = {},
                cent = {},
                // Extract the value cleanly by converting to a string
                ex = arr[0].constructor == Object ? xi => xi[keyx] + '' : xi => xi + '',
                ey = arr[0].constructor == Object ? yi => yi[keyy] + '' : yi => yi + '',
                il = arr.length;
            for (let i = 0; i < il; i++) {
                let x = ex(arr[i]),
                    y = ey(arr[i]);
                if (!op[x]) {
                    op[x] = [];
                    cent[x] = { 
                        n: 0 
                    };
                }
                op[x].push(y);
                cent[x].n++;
            }
            // Get the entropy for each of the variables
            Object.keys(op).map(v => {
                cent[v].h = calc.entropy(op[v]);
                cent[v].p = cent[v].n / il;
            })
            return cent;
        },
        /**
         * Calculates gini impurity of feature x (fx) in relation to target y (fy) in dataset 
         * @description Gini index is an impurity-based criterion that measures the divergences between the probability distributions of the target attribute’s values. The Gini index has been used in various works such as (Breiman et al., 1984) and (Gelfand et al., 1991) 
         * @param {*} data 
         * @param {*} fx 
         * @param {*} fy 
         */
        giniX: function getGINIImpurityX(options = {}) {
            let data = options.data,
                feature = data.feature,
                target = options.target;
            // Gini index is an impurity-based criterion that measures the divergences between the probability distributions of the target attribute’s values. 
            // The Gini index has been used in various works such as (Breiman et al., 1984) and (Gelfand et al., 1991) 
            // Example: https://sefiks.com/2018/08/27/a-step-by-step-cart-decision-tree-example/
            // Both types: https://medium.com/deep-math-machine-learning-ai/chapter-4-decision-trees-algorithms-b93975f7a1f1
            // Parameters: https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html#sklearn.tree.DecisionTreeClassifier
            // Gini = 1 – Σ (Pi)2 for i=1 to number of classes
            let fValues = { gini: 0 },    // object of all sums based on feature values and within are the target values of those feature values
                fArr = [],           // array of all values to save time by just looping through
                dataLength = data.length;  // length of the input data
            //? is pushing to the array x*value times faster than running an Object.keys on the fValues object?
            // this section gets the counts for each target value by the feature value
            //! may be further optimized by allowing it to loop though once and get all of the gini indexes at once
            for (let i = 0, il = data.length; i < il; i++) {
                let a = data[i],   // current record
                    vx = a[feature],     // value of x
                    vy = a[target];     // value of target
                if (!fValues[vx]) { // if the value isn't in the proba obj
                    fValues[vx] = { sum: 0, gini: 1, keys: [] }; // create an object for the f value
                    fArr.push(vx); // add value to array value list
                }
                if (!fValues[vx][vy]) {
                    fValues[vx][vy] = 0;  // if there isn't a target value property in the f value object, initialize
                    fValues[vx].keys.push(vy); // add the key for easy summation later
                }
                fValues[vx].sum++; // add to the total count of this f value
                fValues[vx][vy]++; // add to the count of the target value for this f value object
            }
            // now calculate the actual probabilities by looping through the x values
            fArr.map(vx => {
                let fx = fValues[vx];   // shorthand cache the object property
                fx.keys.map(vy => {     // for each value of y for those values of x
                    fx.gini -= Math.pow((fx[vy] / fx.sum), 2); // subtract the probability squared
                })
                fValues.gini += fx.gini * (fx.sum / dataLength);
            })
            // debugger;
            return fValues;
        },
        /**
         * Calculates gini impurity of feature x (fx) in relation to target y (fy) in dataset 
         * @description Gini index is an impurity-based criterion that measures the divergences between the probability distributions of the target attribute’s values. The Gini index has been used in various works such as (Breiman et al., 1984) and (Gelfand et al., 1991) 
         * @param {*} data 
         * @param {*} fx 
         * @param {*} fy 
         */
        giniFn: function getGINIImpurityX(options = {}) {
            let data       = options.data,
                feature    = options.feature,
                target     = options.target,
                fn         = options.fn || false,
                fValues    = { score: 0 },          // object of all sums based on feature values and within are the target values of those feature values
                fArr       = [],                    // array of all values to save time by just looping through
                dataLength = data.length;           // length of the input data
            for (let i = 0, il = data.length; i < il; i++) {
                let a   = data[i],      // current record
                    vx  = a[feature],   // value of x
                    vy  = a[target],    // value of target
                    fnx = fn?fn(a):vx;
                if (!fValues[fnx]) { // if the value isn't in the proba obj
                    fValues[fnx] = { sum: 0, score: 1, keys: [] }; // create an object for the f value
                    fArr.push(fnx); // add value to array value list
                }
                if (!fValues[fnx][vy]) {
                    fValues[fnx][vy] = 0;  // if there isn't a target value property in the f value object, initialize
                    fValues[fnx].keys.push(vy);  // add the key for easy summation later
                }
                fValues[fnx].sum++; // add to the total count of this f value
                fValues[fnx][vy]++; // add to the count of the target value for this f value object
            }
            // now calculate the actual probabilities by looping through the x values
            fArr.map(fnx => {
                let fx = fValues[fnx];   // shorthand cache the object property
                fx.keys.map(vy => {     // for each value of y for those values of x
                    fx.score -= Math.pow((fx[vy] / fx.sum), 2); // subtract the probability squared
                })
                fValues.score += fx.score * (fx.sum / dataLength);
            })
            // debugger;
            return fValues;
        },
        /**
        * Calculates gini impurity of feature x (fx) in relation to target y (fy) in dataset 
        * @description Gini index is an impurity-based criterion that measures the divergences between the probability distributions of the target attribute’s values. The Gini index has been used in various works such as (Breiman et al., 1984) and (Gelfand et al., 1991) 
        * @param {*} data 
        * @param {*} feature 
        * @param {*} target 
        */
        giniOptimized: function getGINIImpurityX(options) {
            let data = options.data,
                target = options.target
                min = options.min || 1,
                f = { 
                    best: { 
                        score  : 0,
                        feature: false
                    } 
                },    // object of all sums based on feature values and within are the target values of those feature values
                fDiscrete =  [],
                fContinuous =  [],
                fArr = Object.keys(data[0]).filter(fx => { // get the keys
                    if (fx != target) {           // make sure we're not taking the target variable
                        f[fx] = {
                            score    : 0,                               // score for the feature
                            valuesArr: [],
                            valuesObj: {},
                            number   : data[0][fx].constructor == Number,
                        };              // initialize each feature's score obj
                        if (f[fx].number) fContinuous.push(fx);
                        else fDiscrete.push(fx);
                        return true;    // for filtering the array
                    } else return false;
                }),
                fCount = fDiscrete.length,       // caching for looping later
                dataLength = data.length;   // length of the input data
            for (let i = 0, il = dataLength; i < il; i++) {
                let a = data[i],    // current record
                    vy = a[target];     // value of target
                for (let j = 0; j < fCount; j++) { // loop through all of the features in this record
                    let fName = fDiscrete[j],   // get the current feature
                        fx = f[fName],     // the object of values for this feature
                        vx = a[fName];     // value of x
                    if (!fx.valuesObj[vx]) { // if the value isn't in the feature value obj
                        fx.valuesObj[vx] = { sum: 0, score: 1, targetArr: [], targetObj: {} }; // create an object for the f value
                        fx.valuesArr.push(vx); // add value to array value list
                    };
                    let fxv = fx.valuesObj[vx];
                    if (!fxv.targetObj[vy]) {
                        fxv.targetObj[vy] = 0;  // if there isn't a target value property in the f value object, initialize
                        fxv.targetArr.push(vy); // add the key for easy summation later
                    };
                    fxv.sum++;  // add to the total count of this f value
                    fxv.targetObj[vy]++; // add to the count of the target value for this f value object
                }
            };
            // now calculate the actual probabilities by looping through the x values
            for (let i = 0; i < fCount; i++) {
                let fx = f[fDiscrete[i]];    // this time it's the object. is that confusing?
                for (let j = 0, jl = fx.valuesArr.length; j < jl; j++) {
                    let fvx = fx.valuesObj[fx.valuesArr[j]]; // value of y for this values of x
                    for (let h = 0, hl = fvx.targetArr.length; h < hl; h++) {
                        let vy = fvx.targetObj[fvx.targetArr[h]];
                        fvx.score -= Math.pow((vy / fvx.sum), 2); // subtract the probability squared
                    }
                    fx.score += fvx.score * (fvx.sum / dataLength);
                }
                if (fx.score > f.best.score) f.best = Object.assign({feature: fArr[i], score: fx.score}, fx);
            }
            // Now to handle the continuous variables... makes it less efficient but oh well
            for (let i = 0, il = fContinuous.length; i < il; i++){
                let fx = fContinuous[i],
                    fgx = calc.bestSplitFeature({
                        data   : data,
                        target : target,
                        feature: fx,
                        min    : min
                    });
                f[fx] = Object.assign({feature: fx, score: fgx.score, value: fgx}, fgx);
                // console.log(f[fx]);
                if (fgx.score >= f.best.score) f.best = f[fx];
            }
            return f;
        },
       
        gainNotOptimized: (options) => {
            let nData     = options.data||false,
                nFeatures = options.features,
                nEntropy  = options.entropy,
                target    = options.target,
                maxgain   = {gain: 0},
                gains     = {};
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
        gainOptimized: () => {
            // hasn't been written yet :(
        },
        group: (options) => {
            let data    = options.data,
                feature = options.feature,
                op      = options.op || '==',
                value   = options.value || false,
                ret     = {values: [], data: {}};
            if (value) {
                for (let i = 0, il = data.length; i <il; i++){
                    let x       = data[i],
                        xiValue = x[feature],
                        check   = calc.compare(xiValue, value, op),
                        key     = `${check?'':'!'}${op}\|${value}`;
                    if  (!ret.data[key]) {
                        ret.data[key] = [];
                        ret.values.push(key);
                    }
                    ret.data[key].push(x);
                } 
            } else {
                for (let i = 0, il = data.length; i <il; i++){
                    let x       = data[i],
                        xiValue = x[feature],
                        key     = `${op}\|${xiValue}`;
                    if  (!ret.data[key]) {
                        ret.data[key] = [];
                        ret.values.push(key);
                    }
                    ret.data[key].push(x);
                }
            }
            return ret;
        },
        /**
         * Calculates information gain using the entropy functions above (to be optimized later)
         * @description Information gain is an impurity-based criterion that uses the entropy measure (origin from information theory) as the impurity measure (Quinlan, 1987).
         * @param {*} data 
         * @param {*} feature 
         * @param {*} target 
         * @param {*} baseEntropy 
         */
        gain_rollback: function getInformationGain(data, feature, target, baseEntropy) {
            let ht = baseEntropy || calc.entropy(data, target),
                hh = calc.centropy(data, feature, target),
                gainSum = 0;
            Object.values(hh).map(k => {
                let cur_val = (k.h * k.p);
                ht -= cur_val;
                gainSum += cur_val;
            })
            return ht;
        },
        compare: function compareValues(val1, val2, type = '==') {
            switch (type) {
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
        },
        gain: (options = {}) => {
            let maxgain = {score: 0, feature: false},
                gains   = {},
                data    = options.data,
                features= options.features || Object.keys(data[0]),
                target  = options.target,
                entropy = options.entropy || calc.entropy(data, target)
            if (data.length > 0){
                console.log(`Selecting feature from ${features.join(', ')}`)
                features.map((f, i) => {
                    if (f != target) {
                        let curgain = calc.gain_rollback(data, f, target, entropy);
                        gains[f] = {
                            feature: f,
                            score  : curgain,
                            i      : i
                        };
                        maxgain = curgain > maxgain.score?gains[f]:maxgain;
                    };
                })
            } else console.log(`No data for ${this.id}, must be a leaf`);
            return maxgain;
        },
        /**
         * Used to get the best split of a certain feature in a dataset depending on the selected criterion and method
         * WATERMELONNN! RESUME HERE
         */
        bestSplitFeature: (options = {}) => {
            let method  = options.method || 'gini',
                feature = options.feature,
                target  = options.target,
                data    = options.data.ascend(feature),
                best    = {
                    score: 0,
                    value: false
                },
                debug = options.debug || false,
                ginis = {},
                min   = options.min || 1;  // minimum number of samples in a split
            switch (method){
                case 'gini':
                    // let values = [];
                    // get all of the values of x and y
                    // for (let i = 0, il = data.length; i < il; i++){
                    //     let x = data[i][feature],
                    //         y = data[i][target];
                    //     values.push({x, y});
                    // }
                    if (data.length >= min*2) for (let i = 1, il = data.length - min; i < il; i++){
                        let a = data[i],
                            cv = data[i][feature],
                            xl = data[i-1][feature],
                            xv = xl+((cv - xl)/2);
                        if (!ginis[xv]){
                            let xg = calc.giniFn({
                                    data   : data,
                                    fn     : (x) => x[feature] <= xv,
                                    feature: feature,
                                    target : target,
                                });
                            ginis[xv] = xg;
                            ginis[xv].value = xv;
                            ginis[xv].score = 1 - ginis[xv].score
                            if (debug) console.log(xg);
                            try {
                                if (xg.true && xg.false){
                                    if (xg.score >= best.score && xg.true.sum >= min && xg.false.sum >= min) best = xg;
                                    // else if (xg.true.sum < min || xg.false.sum < min) debugger;
                                }
                                // If there's not one of the columns there's not enough in one of the groups
                            } catch (err){
                                console.error(err);
                                debugger;
                            }
                        }       
                    };
                if (debug) {
                    console.log(best);
                    debugger;
                }
                return best;
                // case 'gain':
                // case 'random':
            }
        },
        gini: (options = {}) => {
            let data    = options.data || false,
                feature = options.feature   || false,
                target  = options.target   || false;
            if (!data || !target) return new ReferenceError('Cannot calculate without data and target arguments');
            else {
                let gini = calc[feature ? 'giniX' : 'giniOptimized'](options);
                if (gini.best) return {
                    feature: gini.best.feature,
                    value  : gini.best.value,
                    score  : gini.best.score
                }
            }
        }
    };
module.exports = calc;