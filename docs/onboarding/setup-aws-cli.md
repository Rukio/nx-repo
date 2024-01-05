# Setting up AWS CLI

## Install the CLI

https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

```
brew install awscli
```

## Create Access Key Pair

For each account that you configure the cli with, you will need to complete the following steps:

1. Sign into the [AWS Management Console](https://console.aws.amazon.com) for the account you want to configure
   1. If you cannot log in to the console, speak with your manager who should be able to get you set up
   2. See [AWS Accounts](#aws-accounts) for a list of accounts
2. Go to the [security credentials console](https://console.aws.amazon.com/iam/home#/security_credentials)
3. In the Access keys section, click the `Create access key` button.
4. To view the new access key pair, choose Show. **You will not have access to the secret access key again after this dialog box closes.** Your credentials will look something like this:
   1. Access key ID: `AKIAIOSFODNN7EXAMPLE`
   2. Secret access key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

For more information, see https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds-create

## Configure

https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html

The following items are required for each account you want to configure the cli for:

- A user created in the account
- the `AWS_PROFILE` name for the account found in [AWS Account](#aws-accounts)
- Access Key for that user
- Secret Key for that user

Run and complete the command below that associates with the account you want to configure

```bash
aws configure --profile prod        # michaelsawsaccount
aws configure --profile stage       # dh-staging
aws configure --profile swe-prod    # swe-production-*company-data-covered*
aws configure --profile swe-dev     # swe-development-*company-data-covered*
```

You can then use the profile by setting the environment variable `AWS_PROFILE`:

```bash
AWS_PROFILE=staging aws s3api list-buckets

# or

export AWS_PROFILE=staging
aws s3api list-buckets
```

## AWS Accounts

| AWS_PROFILE | AWS Account Name                         | Account ID     |
| ----------- | ---------------------------------------- | -------------- |
| `prod`      | `michaelsawsaccount`                     | `329245343759` |
| `stage`     | `dh-staging`                             | `530082637045` |
| `swe-prod`  | `swe-production-*company-data-covered*`  | `651625208281` |
| `swe-dev`   | `swe-development-*company-data-covered*` | `783655260372` |

# Useful References

### Secrets Management

It is common to create or update secrets when implementing new Terraform resources.

Get Secret:

```
# Set your profile to the account where the secret is stored.
# Most are stored in michaelsawsaccount today, e.g. "prod" or however you have named it.
AWS_PROFILE=prod

# Fetch the secret
# Replace the name of your secret as needed
SECRET_NAME="google-production-terraform-service-account"
aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region us-west-2
```

Set Secret:

```
AWS_PROFILE=prod

# Set secret from file:
aws secretsmanager put-secret-value --region us-west-2 --secret-id $SECRET_NAME --secret-string file://tmp.json

# Or directly...
aws secretsmanager put-secret-value --region us-west-2 --secret-id $SECRET_NAME --secret-string "shh don't tell"
```
