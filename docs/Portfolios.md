# **Portfolios management**
Here, Portfolios can be created, modifed, imported (csv and JSON) and exported (csv and JSON). Moreover, you can load portfolios from the server backend. If you have write permissions, you can store a portfolio on the server backend.

## Table of contents
1. [Defintion of a portfolio](#basic) 
2. [Attributes](#attributes)
3. [Management of a portfolio](#management)
4. [Data formats](#formats)
    1. [JSON format](#JSON)
    2. [CSV format](#CSV)

## Defintion of a portfolio <a name="basic" style="padding-top: 50px"></a>
A portfolio is a collection of positions in financial instruments. The JSON risk app supports the following instruments types:

- **Fixed income instruments**: fixed rate bonds, floating rate bonds, interest rate swaps, FX spot and forwards contracts.
- **Callable fixed income instruments**: plain vanilla swaptions, single callable and multicallable bonds.

While each item in the portfolio can have an arbitrary number of attributes with arbitraty names and types, instruments should have a number of properties set in order to perform calculations with the portfolio.

## Attributes<a name="attributes" style="padding-top: 50px"></a>

The three attributes below should be present on every item in the portfolio:

 - id - A unique identifier.
 - sub\_portfolio - An identifier for the sub portfolio the instrument belongs to. The sub portfolio defines the finest aggregation level for the Simulation app, i.e., instruments with the same sub portfolio are shown as aggregates. If single position results are needed, you can populate the field sub\_portfolio with the unique id.
 - type - The instrument type, either `bond`, `floater`, `swap`, `swaption`, `callable_bond` or `fxterm`.

Then, it is useful to populate the standard JSONrisk attributes for financial instruments, such as

 - notional
 - currency
 - effective\_date
 - maturity
 - tenor
 - bdc
 - dcc
 - calendar

and many more. The links below provide documentation on how to represent financial instruments with JSONrisk:

 - The [Instruments guide](https://www.jsonrisk.de/01_Documentation/01_Instruments.html) summarizes supported instruments and features
 - The [Fields guide](https://www.jsonrisk.de/01_Documentation/02_Fields.html) contains a complete list of JSON fields for describing instrument terms and conditions
 - The [Data types guide](https://www.jsonrisk.de/01_Documentation/03_Data_types.html) explains the data types used in the JSON fields
 - The [Schedule generation guide](https://www.jsonrisk.de/01_Documentation/05_Schedule_generation.html) explains how JSON risk generates schedules for interest rate instruments.

Moreover, it makes sense to populate market data assignment attributes, such as

 - discount_curve - A string representing a curve,
 - spread_curve - A string representing a curve,
 - forward_curve - A string representing curve,
 - surface - A string representing a surface.

The market data objects should refer to objects present in a parameter set (see [Documentation of the Parameters applet ](/docs/Parameters.md)). Finally, arbitrary other attributes can be set on each instrument. Purposes for this include

 - Reporting attributes, e.g. purely informational attributes that do not have any impact on modeling of the financial instrument, but are used for slicing and dicing of the results in the [Reports applet](/docs/Reports.md).
 - Attributes that are referenced by custom [Modules](/docs/Modules.md), e.g., custom curve assignment logic or other customized mapping logic.
 
## Management of portfolios <a name="management" style="padding-top: 50px"></a>

#### Create a portfolio

Click **`Create Portfolio`** on the left panel. An empty portfolio is initialized in the user interface. You can add instruments using the **`Create instrument`** or **`Import`** features.

**Remark: This does not change any data on the server unless you explicitly save the portfolio.**

#### Import data into a portfolio

Click **`Import instruments (json)`** or **`Import instruments (csv)`** in the **`Import`** dropdown menu on the main screen. Subsequently, search for the file in the local file browser. The file you select needs to have a valid format, see [JSON format](#JSON) and [CSV format](#CSV) below. Importing data adds them to the current portfolio. If you want the current portfolio to contain the data from the file only, you can clear the portfolio before the import by hitting the **`Clear portfolio`** button.

**Remark: This does not change any data on the server unless you explicitly save the portfolio.**

#### Export data to a file

Click **`Export (json)`** or **`Export (csv)`** in the **`Export`** dropdown menu on the main screen. Subsequently, select path and filename in the dialog that opens.

#### Create an instrument

Click **`Create instrument`** on the main screen. This opens a JSON editor with a JSON representation of an example instrument. You can edit the JSON representation. Click **`Add as new item`** to add the instrument to the current portfolio. If the id field is not present or is not unique, a new unique id is generated. Click **`Cancel`** to leave the current portfolio unchanged.

**Remark: This does not change any data on the server unless you explicitly save the portfolio.**

#### Edit an instrument

When at least one instrument it present in the portfolio, you can edit any instrument by clicking the **`Edit`** button in the Actions column on the main table. This opens a JSON editor with a JSON representation of an example instrument. You can edit the JSON representation. Click **`Save`** to save the changes for the current portfolio. Click **`Add as new item`** to add the instrument to the current portfolio. If the id field is not present or is not unique, a new unique id is generated. Click **`Cancel`** to leave the current portfolio unchanged.

**Remark: This does not change any data on the server unless you explicitly save the portfolio.**

#### Remove an instrument

When at least one instrument it present in the portfolio, you can remove any instrument by clicking the **`Remove`** button in the Actions column on the main table.

**Remark: This does not change any data on the server unless you explicitly save the portfolio.**

#### Analyze an instrument

When at least one instrument it present in the portfolio, you can open any instrument in the [Analysis applet](/docs/Analysis.md) by clicking the **`Analyze`** button in the Actions column on the main table. The Analysis app opens in a new tab.

#### Save a portfolio on the server backend

Choose a date and a name in the fields left of the **`Save`** button on the top of the main panel. Click the **`Save`** button to store the current portfolio on the server backend under the chosen date and name.

**Remark: This changes data on the server and requires write permissions.**

#### Load a portfolio from the server backend

Click **`Portfolios`** on the left pane to show all available portfolios on the server backend. Select a portfolio from the list by clicking **`View`** in the Actions table in the portfolios view. 

#### Upload a portfolio on the server backend

Click **`Upload`** on the left pane. Type in a name and a date for the portfolio. Choose a file in the local file browser. The file must have an appropriate format, see [JSON format](#JSON) and [CSV format](#CSV) below. Click **`Upload`** to store the portfolio from the file on the server backend under the chosen date and name.

**Remark: This changes data on the server and requires write permissions**

**Remark: This action is largely equivalent to creating an empty portfolio, importing the file, and then saving the portfolio to the server backend.**


## Data formats <a name="formats" style="padding-top: 50px"></a>

Find below an example of a portfolio with a fixed rate bond (id=1), floating rate bond (id=2), interest rate swap (id=3), fx term (id=4), plain vanilla swaptions (id=5) and a multicallable bond (id=6) in csv and JSON format. In this example, the non mandatory attribute sub_portfolio is set: this attribute is used to aggregate results data. The order of the attributes in both formats does not matter.

#### JSON format<a name="JSON" style="padding-top: 50px"></a>

The JSON format is equivalent to a JSON array of JSON objects. The objects are the items in the portfolio.

```
[
 {
  "id": 1,
  "type": "bond",
  "sub_portfolio": "bonds",
  "notional": 100000,
  "currency": "EUR",
  "maturity": "2010-01-01",
  "tenor": 1,
  "fixed_rate": 0.01,
  "calendar": "TARGET",
  "dcc": "Act/360",
  "bdc": "following",
  "float_dcc": "Act/Act",
  "float_bdc": "unadjusted",
  "effective_date": "2000-01-01",
  "disc_curve":"",
  "spread_curve":""
 },
 {
  "id": 2,
  "type": "floater",
  "sub_portfolio": "floaters",
  "notional": 100000,
  "currency": "EUR",
  "maturity": "2010-01-01",
  "fixed_rate": 0.003,
  "tenor": 6,
  "calendar": "TARGET",
  "dcc": "Act/360",
  "bdc": "following",
  "effective_date": "2000-01-01",
  "disc_curve":"",
  "spread_curve":""
 },
 {
  "id": 3,
  "type": "swap",
  "sub_portfolio": "swaps",
  "notional": 10000,
  "currency": "EUR",
  "maturity": "2010-01-01",
  "tenor": 12,
  "fixed_rate": 0.01,
  "float_current_rate": 0.01,
  "calendar": "TARGET",
  "dcc": "Act/365",
  "bdc": "modified",
  "float_tenor": 1,
  "float_dcc": "30/360",
  "float_bdc": "preceding",
  "effective_date": "2000-1-01",
  "is_payer": false,
  "is_short": false,
  "disc_curve":"",
  "fwd_curve":""
 },
 {
  "id": 4,
  "type": "fxterm",
  "sub_portfolio": "fxterms",
  "notional": 10000,
  "currency": "USD",
  "maturity": "2010-01-01",
  "tenor": 12,
  "fixed_rate": 0.01,
  "calendar": "TARGET",
  "dcc": "30/360",
  "bdc": "preceding",
  "float_dcc": "Act/365",
  "float_bdc": "modified",
  "disc_curve":""
 },
 {
  "id": 5,
  "type": "swaption",
  "sub_portfolio": "swaptions",
  "notional": 10000,
  "currency": "EUR",
  "maturity": "2010-01-01",
  "tenor": 3,
  "fixed_rate": 0.01,
  "float_current_rate": 0.01,
  "calendar": "TARGET",
  "dcc": "Act/365",
  "bdc": "modified",
  "float_tenor": 6,
  "float_dcc": "30/360",
  "float_bdc": "preceding",
  "effective_date": "2000-01-01",
  "first_exercise_date": "2005-01-01",
  "is_payer": false,
  "is_short": false,
  "disc_curve":"",
  "fwd_curve":"",
  "surface":""
 },
 {
  "id": 6,
  "type": "callable_bond",
  "sub_portfolio": "callable_bonds",
  "notional": 100000,
  "currency": "EUR",
  "maturity": "2010-01-01",
  "tenor": 1,
  "fixed_rate": 0.01,
  "calendar": "TARGET",
  "dcc": "Act/360",
  "bdc": "following",
  "float_dcc": "Act/Act",
  "float_bdc": "unadjusted",
  "effective_date": "2000-01-01",
  "first_exercise_date": "2005-01-01",
  "call_tenor": 12,
  "disc_curve":"",
  "spread_curve":"",
  "fwd_curve":"",
  "surface":""
 }
]
```

#### CSV format <a name="CSV" style="padding-top: 50px"></a>
The CSV format must be comma or semicolon separated. It must contain a header line containing the field names. Each additional line represents an item in the portfolio.
```
"id","type","sub_portfolio","notional","currency","maturity","tenor","fixed_rate","float_current_rate","calendar","dcc","bdc","float_tenor","float_dcc","float_bdc","effective_date","disc_curve","fwd_curve","surface","spread_curve","is_payer","is_short","first_exercise_date","call_tenor","excl_margin","simple_calibration"
6,"callable_bond","callable_bonds",100000,"EUR",2010-01-01,1,"0.01",,"TARGET","Act/360","following",,"Act/Act","unadjusted",2000-01-01,,,,,,,2005-01-01,12,,
5,"swaption","swaptions",10000,"EUR",2010-01-01,3,"0.01","0.01","TARGET","Act/365","modified",6,"30/360","preceding",2000-01-01,,,,,"false","false",2005-01-01,,,
4,"fxterm","fxterms",10000,"USD",2010-01-01,12,"0.01",,"TARGET","30/360","preceding",,"Act/365","modified",,,,,,,,,,,
3,"swap","swaps",10000,"EUR",2010-01-01,12,"0.01","0.01","TARGET","Act/365","modified",1,"30/360","preceding","2000-1-01",,,,,"false","false",,,,
2,"floater","floaters",100000,"EUR",2010-01-01,6,3,,"TARGET","Act/360","following",,,,2000-01-01,,,,,,,,,,
1,"bond","bonds",100000,"EUR",2010-01-01,1,"0.01",,"TARGET","Act/360","following",,"Act/Act","unadjusted",2000-01-01,,,,,,,,,,
```
 


