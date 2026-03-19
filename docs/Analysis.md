# Analysis
The Analysis applet provides deep-dive analysis of a single instrument. It allows calculation of present values under scenarios and inspection of detailed results like cash flows and cash flow tables.

For calculation of risk figures on a whole portfolio of instruments, see [documentation of the Simulation applet](/docs/Simulation.md) or [documentation of the Batch applet](/docs/Batch.md).

##### Table of contents
1. [Creating and editing an instrument](#instr)
2. [Parameters and scenarios](#params)
2. [Results](#results)

## Creating and editing an instrument <a name="instr" style="padding-top: 50px"></a>
The easiest way to create an instrument in the Analysis applet is to just click `Analyze` for any existing instrument in the `Portfolio` or `Simulation` applet. This immediately opens the Analysis applet with a copy of the instrument.

Then, there are two ways to edit instrument attributes within the JSON risk analysis applet:

  - Edit the instrument's JSON representation directly: Click `Edit JSON` and edit, add or remove properties freely. Click `Recalc` to make your changes effective.
  
  - Edit fields separately: Click `Edit fields` and edit each field separately. Here, a fixed set of fields is supported, including the [standard JSON risk instrument fields](https://jsonrisk.de/01_Documentation/02_Instrument_fields.html). Changes are effective immediately while typing.
 
## Parameters and scenarios <a name="params" style="padding-top: 50px"></a>

In order for the analysis applet to calculate anything, a parameter set must be seleced. Optionally, you can select a scenario group. For managing parameter sets see [documentation of JSON risk app parameter management ](/docs/Parameters.md). For managing scenario groups, see [documentation of JSON risk app scenarios management ](/docs/Scenarios.md).

Calculations are performed automatically each time you select a parameter set or a scenario group, and the results are displayed.

## Results <a name="results" style="padding-top: 50px"></a>

When a valid instrument and parameters are set up, the Analysis applet immediately shows

 - A table with present values and scenario PnLs.
 - A section with Cashflows, Interest Cashflows and Principal Cashflows.
 - Detailed cash flow tables for the instrument. In case of a swap or swaption instrument, two separate tables for the fix leg and the float leg are shown.
 - Moreover, the analysis applet displays all warnings or errors that occurred during calculations.

The cash flow tables provide information on each accrual period:

 - `Pmt date`: The payment date of the accrual period. This is always the Accr end date adjusted according to the leg's business day convention.
 - `Accr start date`: The start date of the accrual period.
 - `Accr end date`: The end date of the accrual period.
 - `Accr factor`: The year fraction between Accr start and end dates, according to the leg's day count convention.
 - `Fwd rate`: The forward rate for the accrual period or zero in case of a fixed rate instrument.
 - `Interest date`: Is the end of this accrual period an interest payment date? If yes, interest is paid out in the end. If no, accrued interest is carried forward to the next period.
 - `Fixing date`: Is the forward rate reset at the end of this accrual period?
 - `Repay date`: Is there a repayment in the end of this accrual period?
 - `Condition change date`: Is there a new interest rate or a new repayment amount scheduled for the end of this accrual period?
 - `Current principal`: The principal amount of this accrual period which is the basis of interest rate calculations.
 - `Accr`: Accrued interest in the end of this accrual period after interest rate payments. In periods with Interest date = true, this is always zero.
 - `Int pmt`: The interest paid at the end of this period. In periods with Interest date = false, this is always zero.
 - `Principal pmt`: The principal paid at the end of this period. In periods with Repay date = false, this is always zero.
 - `Total pmt`: The sum of Int pmt and Principal pmt.

For more details about cash flow generation in JSON risk, see [documentation of JSON risk schedule generation](https://jsonrisk.de/01_Documentation/05_Schedule_generation.html).
