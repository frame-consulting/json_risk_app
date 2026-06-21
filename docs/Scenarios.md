# **Scenarios management**
Scenario groups define shocks that apply to parameters. The link between specific shocks and risk factors allows flexible configuration. Users can create, edit, import or export scenario groups without write permissions. In order to store scenario groups on the server backend, write permissions are required.

## Table of contents
1. [Defintion of a scenario group](#basic) 
2. [Management of a scenario group](#manage)
3. [Data format (JSON)](#format)

## Defintion of a scenario group <a name="basic" style="padding-top: 50px"></a>
A scenario group must have a name that consists of letters, numbers, dashes and underscores only. A scenario group consists of one or more scenarios. A single scenario consists of a name and one or more rules. The rules are used to determine the risk factors (i.e., parameters) to which the scenarios should be applied and what shock to apply.

Here is an outline of the structure of a scenario:
 - **Scenario group**: A collection of scenarios
 - **Scenario**: an object with a name (without blank spaces) and a collection of rules
 - **Rule(s)**: an object that contains
   - a list of **Risk factors**: The rule applies to each of the risk factors (i.e. scalars, curves, surfaces).
   - a list of **Tags**: all scalars, curves and surfaces that have ALL of the tags in this list attached are affected by this rule (see [documentation of JSON risk app parameters management](/docs/Parameters.md)).
   - a **Model**: Either **additive**, **multiplicative** or **absolute**. If additive, the values of this rule are added to each affected risk factor. If multiplicative, the values of this rule are multiplied with the values of each affected risk factor. If absolute, the values of this rule replace the values of each affected risk factor.
   - a **Values** table:
     - **X-axis labels**: for curves these are the support points; for surfaces these are the expiries of the option.
     - **Y-axis labels**: for curves these labels have no meaning; for surfaces these are the terms of the underlying of the option, or the strikes.
     - **Values**: an array of arrays of values corresponding to labels.

## Management of a scenario group <a name="manage" style="padding-top: 50px"></a>

#### Create a scenario group

Click **`New`** on the left panel. An empty scenario group is displayed in the window.

#### Import JSON
  
Click **`Import (JSON)`** on the left panel and search for the file to import from the local file system.

#### Export JSON

Click **`Export (JSON)`** on the left panel to export scenario group in JSON format. You can select path and filename in the dialog that opens.

#### Load a stored scenario group from the server backend
    
Click **`Load`** on the left panel. Select the scenario group in the dropdown box and click **`Load Scenarios`** to display it.

#### Save a scenario to the server backend

To save the currently displayed scenario group, click **`Save`** in the left panel. In the box that opens, you can change the name under which you would like the scenario group to be stored. Then, to store it on the server, click **`Save Scenarios`**. This requires write permissions. Click cancel to close the box.

#### Edit scenario groups
  
 - **Add a scenario**: click **`Add scenario`** at the bottom of scenario list. Then type in a name in the scenario name field and add the required rules as described below.
 - **Delete a scenario**: click **`Delete`** next to the scenario name.
 - **Reorder**: To change the order of scenarios within a group, you can use the **`Move up`** and **`Move down`** buttons right of the scenario name.

#### Edit scenarios 
    
 - **Add rule**: click **`Add rule`**. Edit the ruls as described below.
 - **Delete a rule**: click **`Delete rule`**.

Rules have no names and their order does not matter. When a rule matches a risk factor by name or by the attached tags, its values are applied according to the model.

#### Edit rules
      
 - **add or remove risk factors**: click **`Edit`** next to the risk factors line. In the input dialog you can edit the comma-separated list of risk factors.
 - **add or remove risk tags**: click **`Edit`** next to the tags line. In the input dialog you can edit the comma-separated list of tags.
 - **edit model**: choose the desired model for your rule in the dropdown list.
 - **edit the values table**: Tabular data is entered by using the **`Paste from clipboard`** button. It requires the data to be tab-separated, therefore it is possible to just paste the table from excel. A table with three expiries and two terms looks like that:

```
	1W  3M  6M
1M	0.01	0.01	-0.01
3M	0.02	0.01	-0.02

```
For curves, the table should contain only two lines and the second line should begin with an arbitrary label:

```
	1W  3M  6M
1D	0.01	0.01	-0.01

```
For scalars, the table should contain two lines and two columns only. Labels are arbitrary here:
```
	1D
1D	0.01
```

With the **additive** model, the last example rule would increase the scalar by 0.01 or shift a curve or surface by 0.01 in a parallel sense. With the **multiplicative** model, the rule would increase a scalar or all the values of a curve or surface by 1 percent. With the **abslute** model, the scalar, curve or surface would attain the absolute value of 0.01. For curves and surface that value would be constant over all support points.

## Data format <a name="format" style="padding-top: 50px"></a>
Find below an example of a scenario group in JSON format. Note that the structure of the `values` array of arrays must correspond to the label dimensions. The length of `values` must match the length of `labels_x`, the length of each element in `values` must match the length of `labels_y`. Labels must be strings that can be converted by JSONRisk into a time period, or strings that represent numbers.

```
[
 {
  "name": "JSON_EXAMPLE_SCENARIO",
  "rules": [
   {
    "model": "additive",
    "labels_x": [
     "7d",
     "3m",
     "2y",
    ],
    "labels_y": [
     "1M"
    ],
    "values": [
     [ 0.0 ],
     [ 0.0001 ],
     [ 0.0 ]
    ],
    "risk_factors": [
     "TEST"
    ],
    "tags": [
     "yield"
    ],
   },
   {}
  ]
 },
 {
  ...
 }
]
```



