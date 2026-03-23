# JSONRisk App
An open source multi-tenant risk system based on json_risk

## requirements
JSONRisk App requires

 - php
 - php-fpm
 - nginx
 - nodejs

## Getting started

### Installation

Extract the repository or a release package into a directory `<JR_ROOT>` where your user has write privileges. You should not work with the root user:

 - .zip package: unzip path/to/jsonrisk.zip
 - .tar.gz package: tar -xvzf path/to/jsonrisk.tar.gz
 - .tar.bz2 package: tar -xvjf path/to/jsonrisk.tar.bz2

### Basic Configuration

JSONRisk App does not require any configuration as long as requirements are met. It runs with the defaults below. Uncomment any options and place into a file called `.config` in the `<JR_ROOT>` directory:

```
#
# Hostname
#
# JR_HOSTNAME=json_risk

#
# Port for nginx
#
# JR_PORT=8080

#
# Temp directory for pid files etc
#
# JR_TMPDIR="/tmp/jr_$JR_HOSTNAME"

#
# Directory where all persistent data is stored
#
# JR_DATADIR="$JR_ROOT/.var"

#
# Path to PHP executable. By default, is detected automatically
#
# JR_PHP=

#
# Path to PHP-FPM executable. By default, is detected automatically
#
# JR_PHPFPM=

#
# Path to NGINX executable. By default, is detected automatically
#
# JR_NGINX=

#
# Path to NODE.js executable. By default, is detected automatically
#
# JR_NODEJS=

```

### Security Configuration

The optional file `.security.json` in the `<JR_ROOT>` directory contains security critical information and should be made readable only by the linux user JSONRisk app is run under. It has JSON format and can contain:

 - a `secret` property. This is a string which is used to sign authentication tokens. If this property is not present, a fallback string is used and the application will issue a warning on startup. It is strongly advised to set this property. For cluster setups (see below), this property should be the same on all nodes.
 - a `mail` property. This is used for E-Mail based passwordless login. See [User management](docs/User_Management.md) for details.


### Create an instance and a user

Typically, You can create an instance and a first user by issuing `./jr_user_add <INSTANCE> <USERNAME>` from the `<JR_ROOT>` directory with the linux user you intend to run the application with. This command asks you for a passsword for the first user. The first user will have the permissions to create more users in the GUI.

> Note that an instance is nothing else than a subdirectory under the `<JR_DATADIR>` directory. A user you create is stored in a file `<JR_DATADIR>/<INSTANCE>/user/<USER>.json`, as most data in JSON risk is stored as a plain json file.
> The name of an instance and the name of a user must consist of letters, numbers, hyphens and underscores. 

A special case is the *public* instance. If an instance with the name *public* is created, read access on this instance is open to anyone without login. Such an instance can even run with no users at all. 

### Starting and stopping services

Start with `./jr_start`, stop with `./jr_stop` from the from the `<JR_ROOT>` directory with the linux user you intend to run the application with. That should not be a user with root privileges.

### Using the application

Assuming you have started the application on the standard port 8080, navigate your browser to `127.0.0.1:8080` in order to access the application. Before you log in, you will have read access to the public instance if it exists.

### Cluster setup

JSONrisk App supports cluster setups in a straightforward way. A JSON file in the `<JR_ROOT>` directory needs to be created on the main node. It contains an object with two properties:

 - A `external_hostname` property that contains a valid url under which the main node is reachable from all cluster nodes. The `external_hostname` starts with `http://` or `https://` and ends with `:<PORT>` unless the port is 80 for http or 443 for https.
 - A `cluster_urls` property. It is an array of similar urls, i.e., with protocol and port, under which each cluster is reachable from the main node.
 - Each node must use the same `secret` property in the `.security.json` since the nodes need to accept the auth tokens issued by the main node.

Apart from these URLs, the cluster is laregly self-configuring:

 - Each node calculates on all available CPUs and sends throttle signals back to the main node when it is under too much load.
 - Only the main node needs access to the file system where the data dir resides.
 - The other nodes are stateless in the sense that they get all data needed for calculations from the main node when they need it and cache it in memory only.
 - The nodes do not need to be online all the time. For example, it is possible to keep one of the configured nodes offline and start it only when CPU power is needed. Calculation runs on the main node probe regularly for each cluster node, start using it as soon as it is available, and stop using it when it is offline again.

Here are two example `.cluster.json` configurations. The first in fact represents a dummy configuration with two application instances really running on the same machine. The dummy setup is of course not faster than a single node setup without a `.cluster.json` file, since both nodes share the same cpus.

```
{
    "external_hostname": "http://127.0.0.1:8080",
    "cluster_urls": ["http://127.0.0.1:8080", "http://127.0.0.1:8081"]
}
```

The second could be a typical production setup where all 4 nodes run under port 8080 but are behind an https proxy that runs under the standard https port 443. Therefore, the external urls is https and do not contain a port. The first node in the `cluster_urls` array is the main node. The main node accesses itself without going through the https proxy.

```
{
    "external_hostname": "https://jsonrisk1.example.org",
    "cluster_urls": ["http://127.0.0.1:8080", "https://jsonrisk2.example.org", "https://jsonrisk3.example.org", "https://jsonrisk4.example.org"]
}
```

### Redundant setup

The above cluster setup does not provide redundancy for hardware failures of the main node or disasters such as an off-line data center. The measures below provide a higher level of failure and disaster tolerance, starting from the second example cluster configuration above:

 - Assuming `jsonrisk1.example.org` is the main node, a failure of one of the other nodes only slows down ongoing calculation runs and is not noticed by GUI users otherwise.
 - The `<JR_DATADIR>` could reside on a network file system, and could be mounted on `jsonrisk2.example.org` as well. In case of hardware failure of the main node, users could be notified to use `jsonrisk2.example.org`. As long as the main node works fine, it is important not to use the second node in order to avoid race conditions.
 - The nodes `jsonrisk2.example.org` and `jsonrisk4.example.org` could even reside in another data center to provide a higher level of disaster tolerance. In that case, the `<JR_DATADIR>` needs to reside on a geo-redundant managed file system. A more cost efficient approach would be to place the `<JR_DATADIR>` on a local harddisk on each node and one-way-sync data from the main node to the backup node on a regular basis.

## More documentation

More documentation on various topics is under the docs folder in this repository. All docs are also accessible from the main page within the application. Here are some suggestions where to start:

### Input Data Management

 - Manage financial instruments, positions and portfolios in the [Portfolio applet ](/docs/Portfolios.md)
 - Manage market data and other parameters in the [Parameters applet ](/docs/Parameters.md)
 - Manage scenarios in the [Scenarios applet ](/docs/Scenarios.md)
 - Manage time series in the [Time Series applet ](/docs/Time_Series.md)

### Perform Calculations

 - Start ad-hoc calculations in your browser with the [Simulation applet ](/docs/Simulation.md)
 - Plan and start calculations and other tasks on the server backend with the [Batch applet ](/docs/Batch.md)

### Analyze Results

 - Analyze single-instrument results with the [Analysis applet ](/docs/Analysis.md)
 - Analyze results on portfolio level with the [Reports applet ](/docs/Reports.md)

### Maintenance

 - Manage users and reset your password [User Management ](/docs/User_Management.md)
 - How to implement advanced customizations with [Modules ](/docs/Modules.md)

### JSONrisk library docs

 - The [Instruments guide](https://www.jsonrisk.de/01_Documentation/01_Instruments.html) summarizes supported instruments and features
 - The [Fields guide](https://www.jsonrisk.de/01_Documentation/02_Instrument_fields.html) contains a complete list of JSON fields for describing instrument terms and conditions
 - The [Data types guide](https://www.jsonrisk.de/01_Documentation/03_Data_types.html) explains the data types used in the JSON fields
 - The [Parameters guide](https://www.jsonrisk.de/01_Documentation/02_Parameters.html) explains how to represent parameters for valuation, e.g., yield curves and surfaces.
 - The [Schedule generation guide](https://www.jsonrisk.de/01_Documentation/05_Schedule_generation.html) explains how JSON risk generates schedules for interest rate instruments.
