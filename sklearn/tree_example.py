
# coding: utf-8

# In[3]:

import pandas as pd
import graphviz
import pickle,numpy as np

from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier, export_graphviz
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.metrics import roc_auc_score

sample = "iris"
data = pd.read_csv('sklearn/'+sample+'/'+sample+'.csv')
# data = pd.read_csv('sklearn/'+sample+'/'+sample+'.csv')
# Creating a LabelEncoder and fitting it to the dataset labels.
le = LabelEncoder()
le.fit(data['class'].values)
# Converting dataset str labels to int labels.
y = le.transform(data['class'].values)
# Extracting the instances data.
X = data.drop('class', axis=1).values

# In[17]:
# Creating a DecisionTreeClassifier
# The min_samples_leaf parameter indicates the minimum of objects required at a leaf node.
# The min_samples_split parameter indicates the minimum number of objects required to split an internal node.
# The max_depth parameter controls the maximum tree depth. Setting this parameter to None will grow the
# tree until all leaves are pure or until all leaves contain less than min_samples_split samples.
tree = DecisionTreeClassifier(
    criterion='gini',
    min_samples_leaf=3,
    min_samples_split=3,
    max_depth=None
)
tree.fit(X, y)
# def plot_tree(tree, dataframe, label_col, label_encoder, plot_title):
#     label_names = pd.unique(dataframe[label_col])
#     # Obtaining plot data.
#     graph_data = export_graphviz(tree,
#         feature_names = dataframe.drop(label_col, axis=1).columns,
#         class_names   = label_names,
#         filled        = True,
#         rounded       = True,
#         out_file      = None)
#     # Generating plot.
#     graph = graphviz.Source(graph_data)
#     # graph.format = 'png'
#     graph.render(plot_title)
#     return graph
def review_model(mod, threshold = .50, model_version = 'test', test_X = X, test_y = y, mtype = 'xgboost'):
    output = ''
    output          += 'threshold: '+str(threshold)+'\nlen: '+str(len(test_X))+'\n'
    predicted_proba  = mod.predict_proba(test_X)
    # up               = predicted_proba[:,1] # takes the item at a certain index of each item?
    preds2           = np.where(predicted_proba[:,1] > threshold, 1, 0)
    testy2 = np.where(test_y == 1, 1, 0)
    # from sklearn.metrics import confusion_matrix

    # CM = confusion_matrix(test_y, preds2)
    # print(CM)
    CM               = (pd.crosstab(testy2, preds2, rownames=['Actual Result'], colnames=['Predicted Result']))
    print(str(CM))
    output += "roc: "+str(roc_auc_score(testy2, preds2))+"\n"
    output += "precision: "+str(CM[1][1]/(CM[1][0]+CM[1][1]))+"\n"
    output += "TP: "+str(CM[1][1])+"\nFP: "+str(CM[1][0])+"\nTN: "+str(CM[0][0])+"\nFN: "+str(CM[0][1])
    print(output)
    
    # Export the feature importances!
    # finame = repo+'importance'
    # if mtype == 'xgboost':
    #     fi = list(zip(X_train, mod.feature_importances_))
    #     fi_csv = pd.DataFrame(fi, columns = ["Feature", "Importance"]).sort_values(by=["Importance"], ascending=False)
    #     fi_csv.to_csv(finame+'.csv', sep=',', encoding='utf-8')
    #     fis = ['gain', 'cover', 'weight']
    #     for feature_importance_type in fis:
    #         mod.importanc_type = fis
    #         fig, ax = plt.subplots(figsize=(15,18))
    #         xgb.plot_importance(mod, max_num_features=25, height=0.8, ax=ax, importance_type=feature_importance_type)
    #         plt.savefig(finame+'_'+feature_importance_type+'_'+model_version+'.png')
    # ## Exporting the test data and results to a CSV! 
    # res = pd.DataFrame(predicted_proba, columns=['0', '1'])
    # tes = test_X
    # true_res = pd.concat([res.reset_index(drop=True),tes.reset_index(drop=True)], axis=1)
    # true_res.to_csv(repo+'results'+'_'+model_version+'.csv', sep=',', encoding='utf-8') 
    # # mod._Booster.save_model(repo+'model.bin')   
    # pickle.dump(mod, open(repo+'model.bin', "wb"))
# tree_graph = plot_tree(tree, data, 'class', le, 'sklearn/'+sample+'/'+sample+'')
review_model(tree, .5, 'test', X, y)
# filename = 'sklearn/'+sample+'.sav'
# pickle.dump(tree, open(filename, 'wb'))

