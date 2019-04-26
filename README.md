# willow
todo:
- [ ] write documentation
- [x] persistance
  - [x] model toJSON
  - [x] model fromJSON
- [x] predict
- [x] evaluation metrics
  - [x] ROC
  - [ ] Importance
  - [x] Confusion Matrix
- [ ] visualization
- [ ] Todo 4/26 https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html#sklearn.tree.DecisionTreeClassifier
  - [ ] Importance *
  - [ ] Random Seed *
  - [ ] Hyperparameters:
    - [ ] Min split vs Min leaf *
    - [ ] Random State *
    - [ ] Max Leaf nodes ~
    - [ ] Min Impurity decrease ~
  - [ ] Performance
    - [ ] Training speed *
    - [ ] Export predictions *
  - [ ] Test on one more dataset
  - [ ] RANDOM FOREST!!!!!!!!!!
  - [ ] Visualizations (d3)
# technical information
## model json specification
Models are exported as a set of rules steps in JSON format. Each ruleset has the following properties:
{
    feature: 'x',// the name of the feature as a string
    value: 25, // the value of the feature
    op: '==' // what is used to evaluated
    children: {
        // Children is object with keys as the evaluation of these functions
        // true
        // false
    }
}