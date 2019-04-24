
# coding: utf-8

# In[3]:

import pandas as pd
import graphviz
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier, export_graphviz
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

data = pd.read_csv('sklearn/iris/iris.csv')
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
    min_samples_leaf=5,
    min_samples_split=5,
    max_depth=None
)
tree.fit(X, y)
def plot_tree(tree, dataframe, label_col, label_encoder, plot_title):
    label_names = pd.unique(dataframe[label_col])
    # Obtaining plot data.
    graph_data = export_graphviz(tree,
        feature_names = dataframe.drop(label_col, axis=1).columns,
        class_names   = label_names,
        filled        = True,
        rounded       = True,
        out_file      = None)
    # Generating plot.
    graph = graphviz.Source(graph_data)
    graph.format = 'png'
    graph.render(plot_title)
    return graph
tree_graph = plot_tree(tree, data, 'class', le, 'sklearn/iris/iris')

