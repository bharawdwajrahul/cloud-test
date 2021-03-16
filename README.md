# cloud-carbon-footprint

[![CI](https://github.com/ThoughtWorks-Cleantech/cloud-carbon-footprint/actions/workflows/ci.yml/badge.svg?event=check_run)](https://github.com/ThoughtWorks-Cleantech/cloud-carbon-footprint/actions/workflows/ci.yml)

This is an application that estimates the energy (kWh) and carbon emissions (metric tons CO2e) of cloud provider usage, given a start and end UTC dates.

The core logic is exposed through 2 applications: a CLI and a website. The CLI resides in `packages/cli/`, and the website is split between `packages/api/` and `packages/client/`

## Prerequisites

- Node.js >= 12 (tip: use [nvm](https://github.com/nvm-sh/nvm) or [n](https://github.com/tj/n) to manage multiple Node versions)
- Talisman `curl --silent https://raw.githubusercontent.com/thoughtworks/talisman/master/global_install_scripts/install.bash > /tmp/install_talisman.bash && /bin/bash /tmp/install_talisman.bash`

Note:

- During install, Talisman may fail to add the pre-commit hook to this repository because one already exists for Husky. This is fine because it can still execute in the existing husky pre-commit hook, once installed.
- During install, Talisman will also ask you for the directory of your git repositories. If you don't want to install Talisman in all your git repos, then cancel out at this step.

## Optional Prerequisites

- [Homebrew](https://brew.sh) (to download the AWS CLI)
- AWS CLI `brew install awscli` (if you are authenticating with AWS - see below)
- Terraform [0.12.28](https://releases.hashicorp.com/terraform/0.12.28/). (if you want to deploy using Terraform)

## Setup

```
yarn install
```

This will install dependencies for all packages. We use [Lerna](https://lerna.js.org) to manage both projects.

## Running the web-app

### Quick start (using mocked data)

```
yarn start-with-mock-data
```

This will run the webapp in development mode, using a mocked server. Open http://localhost:3000 to view it in a browser.

### Running the web-app with real data

A few steps are required to run the app with real data. Essentially, your aws account needs to be configured to generate cost and usage reports and save those reports to a database, and the application needs to authenticate with aws and run queries on that database.

1. **Ensure your aws account has the correct permissions**
   - You will need an [IAM user](https://aws.amazon.com/premiumsupport/knowledge-center/create-access-key/) that can create access-keys and modify your billing settings.
1. **Enable the Cost and Usage Billing AWS feature.**
   - This feature needs to be enabled so your account can start generating cost and usage reports. To enable, navigate to your account's billing section, and click on the "Cost and Usage Reports" tab. Reference Cost and Usage Reports documentation [here](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html).
1. **Setup Athena DB to save the Cost and Usage Reports.**
   - In addition to generating reports, we use Athena DB to save the details of those reports in a DB, so we can run queries on them. This is a standard AWS integration, outlined [here](https://docs.aws.amazon.com/cur/latest/userguide/cur-query-athena.html)
1. **Configure aws credentials locally, using awscli.**
   - After [installing awscli](#optional-prerequisites), run `aws configure` and provide your access key and secret access key. Also make sure you select the same region as the one you created your cost and usage reports in.
   - Specify the services and regions that the tool runs on in [packages/core/src/application/Config.ts](packages/core/src/application/Config.ts), for these instructions, change GCP to AWS.
1. **Configure environmental variables for the api and client.**
   - After configuring your credentials with awscli, we need to set a number of environmental variables in the app, so it can authenticate with aws. We use .env files to manage this. Reference [packages/api/.env.template](packages/api/.env.template) for a template .env file. Rename this file as .env, optionally remove the comments and then set the environment variables. By default, the api has configuration for both AWS and GCP. If you are only using one of these cloud providers, you can remove the environment variables associated with the other cloud provider in your `packgages/api/.env` file.
   - There is also a `packages/client/.env` file that is required to be set if the application is being deployed behind Okta. See [client/.env.template](packages/client/.env.template) for a template. Rename this file as .env, optionally remove the comments and then set the environment variables.
   - By default, the client uses both AWS and GCP. If you are only using one of these cloud providers, please update the `appConfig` object in the [client Config file](packages/client/src/Config.ts) to only include your provider in the `CURRENT_PROIVDERS` array.
1. Finally, start up the application

```
yarn start
```

> :warning: **This will incure cost**: Data will come from AWS and will cost money to your project. Use this sparingly if you wish to test with live data. If not, use the command above

> _DISCLAIMER_: If your editior of choice is VS Code, **_we recommend to use either your native or custom terminal of choice (i.e. iterm)_** instead. Unexpected authentication issues have occured when starting up the server in VS Code terminals.

#### Docker

If you would like to run with Docker, you'll need install docker and docker-compose:

- Docker `brew install --cask docker`
- docker-compose (should be bundled with Docker if you installed it on a Mac)

```
docker-compose up
cd packages/api
yarn docker:start //creates a docker container named ccf_base
yarn docker:setup //install dependencies
```

## Running the CLI

#### Local

```
yarn start-cli <options>
```

#### CLI Options

1. You can run the tool interactively with the `-i` flag; CLI will ask for the options/parameters
1. Or you can choose to pass the parameters in a single line:
   ```
   --startDate YYYY-MM-DD \
   --endDate YYYY-MM-DD \
   --region [us-east-1 | us-east-2] \
   --groupBy [day | dayAndService | service] \
   --format [table | csv]
   ```

## Serve the documentation

From the root directory, run the command from the terminal

```
 yarn docs
```

This will serve the docs and give an url where you can visit and see the documentation

## AWS Authentication

We currently support three modes of authentication with AWS, that you can see in [packages/core/src/application/AWSCredentialsProvider.ts](packages/core/src/application/AWSCredentialsProvider.ts):

1. "GCP" - this is used by GCP Service Accounts that authenticate via a temporary AWS STS token. This method is used by the application when deployed to Google App Engine.
2. "AWS" - this is used to authenticate via an AWS role that has the necessary permissions to query the CloudWatch and Cost Explorer APIs.
3. "default" - this uses the AWS credentials that exist in the environment the application is running in, for example if you configure your local environment.

The authentication mode is set inside [packages/core/src/application/Config.ts](packages/core/src/application/Config.ts).

[api/.env](packages/api/.env) is where you configure the options for the "GCP" mode, and set the AWS Accounts you want to run the application against.
You can read more about this mode of authentication in [.adr/adr_5_aws_authentication.txt](.adr/adr_5_aws_authentication.txt), as well as this article: [https://cevo.com.au/post/2019-07-29-using-gcp-service-accounts-to-access-aws/](https://cevo.com.au/post/2019-07-29-using-gcp-service-accounts-to-access-aws/)

### AWS Credentials - only needed for the "default" authentication mode.

- Configure AWS credentials.
  ```
  aws configure
  ```
- Specify the services and regions that the tool runs on in [packages/core/src/application/Config.ts](packages/core/src/application/Config.ts)

### GCP Credentials

- You'll need your team's (or your own) GCP service account credentials stored on your filesystem
- Set the GOOGLE_APPLICATION_CREDENTIALS env variable to the location of your credentials file.
  see https://cloud.google.com/docs/authentication/getting-started for more details.

Note: make sure you use the full path for this environment variable, eg `/Users/<user>/path/to/credential`

## Options for cloud emission estimation

We support two approaches to gathering usage data for different cloud providers. One approach gives a more holistic understanding of your emissions whereas the other prioritizes accuracy:

1. **Using Billing Data (Holistic)** - By default, we query AWS Cost and Usage Reports with Amazon Athena, and GCP Billing Export Table using BigQuery. This pulls usage data from all Linked Accounts in your AWS or GCP Organization. This option is selected by setting `AWS_USE_BILLING_DATA` (AWS) and/or `GCP_USE_BILLING_DATA` (GCP) to true in the server `.env` file. You need to also set additional environment variables as specified in [api/.env.template](api/.env.template) You can see the permissions required by this approach in `ccf-athena.yaml` file. This approach provides us with a more holistic estimation of your cloud energy and carbon consumption, but it is less accurate as we use a constant (rather than measure) CPU Utilization, set in [packages/core/src/domain/FootprintEstimationConstants.ts](packages/core/src/domain/FootprintEstimationConstants.ts).

- When calculating total `wattHours` for AWS Lambda service using Billing Data (Holistic), we are assuming that `MemorySetInMB` will be 1792, and since we will then divide this by the constant 1792, we just don't include it in the calculation.
- For this approach to work with AWS, you will need to have Cost and Usage Reports set up to run daily or hourly, and Athena configured to query these reports in S3. You can read more about this here: [https://docs.aws.amazon.com/cur/latest/userguide/cur-query-athena.html](https://docs.aws.amazon.com/cur/latest/userguide/cur-query-athena.html)
- For this approach to work with GCP, you will need to have a Billing Export Table set up to run hourly or daily, and have BigQuery configured to query these reports. You can read more about this here:[https://cloud.google.com/billing/docs/how-to/export-data-bigquery](https://cloud.google.com/billing/docs/how-to/export-data-bigquery)

2. **Using Cloud Usage APIs (Higher Accuracy)** - This approach utilizes the AWS CloudWatch and Cost Explore APIs, and the GCP Cloud Monitoring API. We achieve this by looping through the accounts (the list is in the [api/.env]([api/.env]) file) and then making the API calls on each account for the regions and services set in [packages/core/src/application/Config.ts](packages/core/src/application/Config.ts). The permissions required for this approach are in the [ccf.yaml](ccf.yaml) file. This approach is more accurate as we use the actual CPU usage in the emission estimation but is confined to the services that have been implemented so far in the application.

- For a more comprehensive read on the various calculations and constants that we use for the emissions algorithms, check out the [Methodology page](METHODOLOGY.md)

### Ensure real-time estimates

If you want up-to-date estimates you will have to delete `packages/cli/estimates.cache.json` and/or `packages/api/estimates.cache.json`. If you don't have this file present, dont worry :) You'll just have to start the server and load the app for the first time. This cache is automatically generated by the app to aid in local development: **_it takes a while (~10min) to fetch up-to-date estimates and consequently generate the cache file_**

## Deploy to Google App Engine

Cloud Carbon Footprint is configured to be deployed to [Google App Engine](https://cloud.google.com/appengine/) (standard environment) using Circle CI. See the [Hello World example](https://cloud.google.com/nodejs/getting-started/hello-world) for instructions on setting up a Google Cloud Platform project and installing the Google Cloud SDK to your local machine.

Before deploying, you'll need to build the application and create the packages/api/.env and packages/client/.env file as detailed above. There are two scripts to populate these files as part of the Circle CI pipeline: [packages/cli/create_server_env_file.sh](packages/api/create_server_env_file.sh) and [client/create_client_env_file.sh](packages/client/create_client_env_file.sh).

Once you've set up the CGP project and have the command line tools, Cloud Carbon Footprint can be deployed with `./appengine/deploy-staging.sh` or `./appengine/deploy-production.sh`, depending on your environment.

Or if you want to use CircleCI, you can see the configuration for this in [.circleci/config.yml](.circleci/config.yml).

It will deploy to `https://<something>.appspot.com`.

If you don't want to deploy the client application behind Okta, then the packages/client/.env file is not needed, and the relevant code can be removed from [client/index.js](packages/client/index.js).

## Deploy to other cloud providers

Cloud Carbon Footprint should be deployable to other cloud providers such as [Heroku](https://www.heroku.com/) or [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/). However only Google App Engine has been tested currently, so there may be some work involved in doing this.

Don't forget to deploy your .env file or otherwise set the environment variables in your deployment.

## Support

Visit our [Google Group](https://groups.google.com/g/cloud-carbon-footprint) for any support questions. Don't be shy!!

© 2020 ThoughtWorks, Inc. All rights reserved.