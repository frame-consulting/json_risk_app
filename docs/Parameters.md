# **Parameters management**

The management of all market data, i.e. curves, exchange rates, volatilities, as well as calendars is done on the parameter tab. Parameter sets stored on the server backend. A user needs write permissions to create, edit, import or export parameter sets. See [documentation of JSON risk app User management ](/docs/User_Management.md).  

## Table of contents
1. [Introduction](#basic)
2. [Create a new parameter set](#create)
3. [Manage scalars, curves, surfaces and calendars](#manage)
4. [Export and import parameter sets](#json)
5. [Save and load parameter sets](#backend)

## Introduction <a name="basic" style="padding-top: 50px"></a>

A parameter is a collection of parameters used to simulate and evaluate financial instruments. A valid parameter set must have a valuation date (yyyy-mm-dd) and typically contains one or more of the objects below:

  - **Scalars** are used as foreign currency exchange rates or equity quotes. The required information on a scalar object are **name** (e.g. USD), **type** (e.g. 'FX'), **tags** and **value**.

  - **Curves** can be discount, forward or spread curves. The required informations on a curve object are **name**, **type** (e.g. 'discount', 'forward', 'spread'), **tags**, **labels/times/days/dates** (support points) and **zcs/dfs** (zero coupon rates or discount factors).

  - **Surfaces** are two-dimensional data used as volatilities or volatility smile segments. A volatility smile consists of x two dimensional surfaces with specific naming conventions, e.g. xxxx (ATM), xxxx+10BP, xxxx-10BP. The required informations of a two dimensional surface are **name**, **type** (e.g. swaption), **tags**, **labels_expiry/experies** (of the underlying option), **labels_term/terms** (term of the underlying instrument) and corresponding **values**.
	
  - **Calendars** is a list of the corresponding bank holidays (yyyy-mm-dd). The default calendar used in the JSON risk app is the TARGET calendar which does not have to be included in any parameter set.

The **name** field is a unique identifier. The **type** field is purely informative. The **tags** field is used in scenario management for the assignment of scenarios to risk factors (see [documentation of JSON risk app scenarios management](/docs/Scenarios.md)).


See the [JSONrisk Parameters guide](https://www.jsonrisk.de/01_Documentation/02_Parameters.html) for details about parameter attributes and there characteristics for scalars, curves and surfaces as well as parameter assignment for instruments.

## Create a new parameter set <a name="create" style="padding-top: 50px"></a>

A new and empty parameter set is easily created by clicking the **`New`** button on the left panel. After that, you can assign a valuation date and a name for the newly created parameter set on the main panel.

## Manage scalars, curves, surfaces and calendars <a name="manage" style="padding-top: 50px"></a>

All the operations described in this section do not change the data on the server backend unless you explicitly save the parameter set.

#### Create new object

Click on the **`Create New`** button on the scalars, curves, surfaces, or calendars section on the main screen. The click opens a JSON editor window with an example object. You can edit the JSON representation directly in the editor window. When you are done editing, press **`Add as new item`** to add the newly created object to the current parameter set. Clicking **`Cancel`** closes the editor without changing the parameter set.

#### Edit object

Click on the **`Edit`** button in the actions column in the scalars, curves, surfaces, or calendars table on the main screen. The click opens a JSON editor window with a JSON representation of the selected object. You can edit the JSON representation directly in the editor window. When you are done editing, press **`Save`** to save your changes or **`Add as new item`** to add the newly created object to the current parameter set. Clicking **`Cancel`** closes the editor without changing the parameter set.

#### Import object from CSV

For the sake of convenience, it is also possible to add new data objects to a parameter set via CSV import. This is done by clicking **`Import New`** on the scalars, curves, surfaces, or calendars section on the main screen. The CSV import does not add any tags to the object created. You can add tags later with the **`Edit`** functionality. The data format depends on the type of object:

 - Generally: The CSV is semicolon or comma separated. Numbers are represented with a dot as decimal separator.

 - Scalars: First column is empty. Second column contains the name in the first row and the value in the second row. During import the type is initialized with the default value "equity / fx". Format example:

```  
	;USD
	;1.0764
```

 - Curves: The first field in the first row contains the name of the curve. Other columns in the first line correspond to support points. They must be given as labels, e.g. "30D", "1M" or "1Y". The second line contains an empty first column and the curve values in the other columns, each corresponding to one of the support points. During import, the type is initialized with the default value "yield / spread". Values are imported as zero coupon rates with convention Actual/365 and annual compounding. Format example:

```
    EXAMPLE_CURVE,1Y,5Y,10Y
    ,-0.795291,-0.778788,-0.699913
```

 - Surfaces: The first field in the first row contains the name of the surface. Other columns in the first line correspond to the expiries. Each additional line contains the term of the surface in the first field and the values in the other fields, each corresponding to the expiry in the top row and the term in the first column. Expiries and terms need to be given as labels. During import, the type is initialized with the default value "bachelier". Values are imported as annual basis point volatilities, e.g., a value of 100 corresponds to one percent annual volatility. Format example:
  
```
    EXAMPLE_SURFACE,1Y,5Y
    1Y,51.85,78.09
    2Y,66.03,88.01
```
  
 - Calendars: This is a single-column file. The first line contains the name of the calendar and each other line contains a date in YYYY-MM-DD, YYYY/MM/DD or DD.MM.YYYY format.

```
    calendar_1
    2017-05-21
    2018-05-21
```


#### Remove object

Click on the **`Remove`** button in the actions column in the scalars, curves, surfaces, or calendars table on the main screen. This removes the corresponding object.

#### Remove all objects of a class

Click on the **`Clear all`** button in the scalars, curves, surfaces, or calendars section on the main screen. This removes all objects of the corresponding type.

## Export and import parameter sets <a name="json" style="padding-top: 50px"></a>

#### Export
Sometimes it is convenient to export a parameter set to the local disk as a JSON file. This is the case if

 - you want to edit the JSON representation of the parameter set in an editor and reimport it later;
 - you want to store the parameter set for later use, e.g. in the pricing applet, but you do not have the permission to save it on the server backend.

Click on the **`Export JSON`** button on the left panel. This opens a dialog where you can choose a location and a file name. The name `params.json` is set as a default file name.

#### Import
Click on the **`Import JSON`** button on the left panel. Choose a valid JSON file, e.g., one you have previously exported. This replaces the content of the current browser window with the data in the JSON file. The Import action does not change anything on the server backend, unless you explicitly save the parameter set later.

#### JSON format example

Find below an example of a parameter set with all kinds of market data and calendars in JSON format.

```
{
 	"name": "parameter_set",
 	"valuation_date": "2000-01-01",
 	"scalars":{"USD":{"type": "equity / fx",
					  "value": 1.0764
				}, 
			   "GBP": {...}
	},
 	"curves":{"curve_1":{"type": "yield",
 						 "tags": ...,
						 "labels": ["1Y","5Y","10Y"],
						 "zcs":[-0.795291,-0.778788,-0.699913]
						 },
			  "curve_2": {...}
    },
 	"surfaces":{"surface_1":{"type": "bachelier",
 							 "tags": ...,
							 "labels_expiry": ["1Y","2Y"],
							 "labels_term": ["1Y"],
							 "values": [[51.85768],[66.03413]]
   			   	},
   			   "surface_2":{...}
    },
 	"calendars":{"calendar_1":{"dates": ["2017-05-21","2018-05-21"]
 				 },
 				"calendar_2":{...}
 	}
}	

```

## Save and load parameter sets <a name="backend" style="padding-top: 50px"></a>

#### Save
Click on the **`Save`** button on the left panel to store the parameter set on the server backend. The parameter set must have a name and a valuation date for this to succeed. After clicking the button, you can edit the name and the valuation date befre you confirm the action by clicking on **`Save Params`** on the top of the main screen. If a parameter set with the same name and valuation date exists on the server, it is replaced.

#### Load

Click on the **`Load`** button on the left panel to open a dropdown list of all parameter sets available on the server. Clicking on **`Load Params`** loads the selected parameter set. All content in the browser window is replaced.



