# willow
todo:
- [ ] write documentation
- [ ] persistance
  - [ ] model toJSON
  - [ ] model fromJSON
- [ ] predict
- [ ] evaluation metrics
  - [ ] ROC
  - [ ] Importance
  - [ ] Confusion Matrix
- [ ] visualization

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