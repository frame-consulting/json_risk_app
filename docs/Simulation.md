# **Simulation** 
In the Simulation applet, simulations can be calculated ad-hoc for entire portfolios under scenarios. Calculations do not require CPU resources on the server, but are carried out in the browser. Moreover, it is not necessary to save data on the server backend to perform calculations. The relevant data such as portfolio, parameters or even scenarios can be imported or entered directly in the Simulation applet, i.e. no special permissions are required. However, data on the server may be used if the user has read permissions. For analyzing just a single instrument, you can use the analysis functionality which also includes the analysis of all cash flows. For more details, see [documentation of JSON risk Analysis applet](/docs/Analysis.md).  


## Table of contents
1. [Input data](#data)
    1. [Portfolio](#port)
    2. [Parameters](#params)
    3. [Scenarios](#scenarios)
2. [Run calculations](#calc)
 
## Input data <a name="data" style="padding-top: 50px"></a>
In order for the Simulation applet to run simulation, a portfolio and a parameter set must be provided on the Portfolio and Parameters tabs. Optionally, a scenario group can also be added on the Scenarios tab. For data requirements and data formats for a portfolio, a parameter set and a scenario group see [documentation of JSON risk Portfolios applet ](/docs/Portfolios.md), [documentation of JSON risk Parameters applet](/docs/Parameters.md) and [documentation of JSON risk Scenarios applet](/docs/Scenarios.md).

#### Portfolio <a name="port" style="padding-top: 50px"></a>

There are three ways to provide the portfolio for the calculations within the JSON risk Simulation applet:
  - **Load portfolio from server backend**: choose date and name of the portfolio saved on the server backend in the corresponding dropdown boxes -> click **`Load Portfolio`**.
  
  - **Import portfolio (JSON or CSV file) from local system**: click **`Import (csv)`** or **`Import (json)`** -> search for the file in the local file browser to import.
  
  - **Type in a portfolio**: click **`Create instrument`** -> enter or paste instrument attributes -> click **`Add as new item`**.
  
It is also possible to modify or remove single instruments to/from the displayed portfolio and to add instruments to the portfolio without saving the changes:

  - **Edit single instruments**: click **`Edit`** next to the instrument -> change instrument attributes -> click **`Save`**.
  
  - **Add new instrument**: click **`Edit`** next to the instrument -> change instrument attributes -> click **`Add as new item`**.
  
  - **Remove instruments**: click **`Remove`** next to the instrument.
  
  - **Import more instruments**: click **`Import more (csv)`** or **`Import more (json)`** -> search for the file on the local file system to import.
  
For later reuse, the portfolio can also be exported as CSV or JSON file by clicking **`Export csv`** or **`Export json`**.

**Remark: Editing portfolios in the Simulation applet does not change any data on the server backend.**

#### Parameters <a name="params" style="padding-top: 50px"></a>

There are three ways to provide parameters for the calculations within the JSON risk Simulation applet: 

- **Load parameter set from server backend**: choose name of the parameter set saved on the server backend in the corresponding dropdown box -> click **`Load Params`**.

- **Import parameter set (JSON file) from local system**: click **`Import (json)`** -> search for the file on the local file system to import.

- **Import single parameter objects via CSV**: Type in **`Valuation date`** -> import single data objects. See [documentation of JSON risk app parameter management -> Add data object to a parameter set -> csv upload](/docs/Parameters.md).

It is also possible to add or remove individual parameter objects to/from the displayed parameter set and to add data objects to the parameter set without saving the changes:

  - **Add parameter objects via csv files**: See [documentation of JSON risk app parameter management -> Add data object to a parameter set -> csv upload](/docs/Parameters.md).
  
  - **Remove parameter objects**: See [documentation of JSON risk app parameter management -> Remove data object(s)](/docs/Parameters.md).

For later reuse, the parameter set can also be exported as JSON file by clicking **`Export`**.

**Remark: Editing parameters in the Simulation applet does not change any data on the server backend.**

#### Scenarios <a name="scenarios" style="padding-top: 50px"></a>
There are two ways to provide the scenarios for the calculations within the JSON risk Simulation applet:

  - **Load scenario group from server backend**: choose name of the scenario group saved on the server backend in the corresponding dropdown boxes -> click **`Load Scenarios`**.
  
  - **Import scenario group (json file) from local system**: click **`Import (json)`** -> search for the file on the local file system to import.

## Run calculations <a name="calc" style="padding-top: 50px"></a>

As previously stated, to run calculations it is necessary to provide a portfolio and a corresponding parameter set, that means parameters from the set have to be assigned to instruments in the portfolio. See [documentation of JSON risk app Portfolios applet ](/docs/Portfolios.md). Moreover, it is possible to use scenarios for calculations.

After the data is available in the Simulation applet as described in the [Input data ](#data) section above, calculations can be started by clicking **`Calculate`** on the results tab. The calculation progress as well as error messages and warnings are displayed on the tab. The IDs of the instruments that could not be evaluated are also displayed.

To analyze or export the results the Reports applet with the results can be opened directly by clicking **`Open report`**. See [documentation of JSON risk Reports applet](/docs/Reports.md) for details.

