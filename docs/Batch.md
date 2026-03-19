# Batch run management

## General

A batch run needs configuration of

 - a list of portfolios
 - a params object
 - an optional list of scenarios
 - an optional list of modules
 - a valuation date
 - a name

Here is an exemplary JSON representation of a run configuration:

```

{
 "portfolios": [
  "2022-05-31/Germany"
 ],
 "params": [
  "2022-05-31_BASE.json"
 ],
 "scenario_groups": [
  "IR_Sensitivities"
 ],
 "modules": [
  "valuation",
  "common_attributes",
  "params_assignment"
 ],
 "valuation_date": "2023-05-31",
 "name": "EXAMPLE_RUN"
}


```

Users can create and execute batch runs in the GUI and on the command line. When a batch run is executed, it collects portfolios, parameters, scenarios and modules. After filtering the portfolio in case a filter module is included, it simulates all instruments in the portfolio executing all business logic in the configured modules against the instruments. The results are made available in the `<INSTANCE>/results` folder for the reports applet.

## Important notes

 - Batch runs use all calculation power on the main node in a standard installation.
 - If a cluster is set up, batch runs use all available nodes in the cluster. If a node becomes unavailable, no results get lost and the node is not used until it is back online. The run probes for offline nodes to become online from time to time.
 - The above is also true if all nodes become unavailable, i.e. if the application is shut down on the main node. Therefore, batch runs usually survive a restart of the application, no matter if they were started in the GUI or on the command line.
 - The name of a run must consist of letters, numbers, hyphens and underscores.

## The batch applet

In the batch applet that is available from the main page, users can create, edit, execute, and delete runs. Moreover, their completion status and a history of executions is shown in the applet.

 - Clicking the **`Create new`** button on the left panel opens a JSON representation of a run. Users can add portfolio, parameters, scenarios and modules, change the name and valuation date, and save the run by clicking **`Save`**. If a run with the same name exists, it is overwritten.

 - Clicking **`Edit`** in the main table for one of the runs opens the run in the JSON editor. Save the run by clicking **`Save`**. If you have changed the name, the run is saved under the new name, overwriting an existing run.

 - Click **`Remove`** in the main table for one of the runs in order to remove it. Runs that are currently running cannot be removed.

 - Click **`Execute`** in the main table for one of the runs in order to execute it. Runs that are currently running cannot be executed.

 - Clicking **`History`** on the left pane opens the history of runs executed. You can download the logs and the configuration there.

## Command line operation

On the command line on the main node, users can execute the `jr_run` command. It takes an instance and a run name (with or without the JSON extension). Here is an example:

```

./jr_run public EXAMPLE_RUN


```
