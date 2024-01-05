# Terraform Style Guide

- [Terraform Style Guide](#terraform-style-guide)
  - [General](#general)
    - [120 Column Limit](#120-column-limit)
    - [Use `snake_case` Labels](#use-snake_case-labels)
    - [Conditionals](#conditionals)
    - [Conditional Resources](#conditional-resources)
    - [Prefer Using Locals](#prefer-using-locals)
    - [Breaking Up Files](#breaking-up-files)
  - [Structure](#structure)
    - [variables.tf](#variablestf)
    - [outputs.tf](#outputstf)
    - [locals.tf](#localstf)
    - [terraform_config.tf](#terraform_configtf)
    - [data.tf](#datatf)
  - [Secrets](#secrets)
  - [State](#state)
  - [Modules](#modules)
    - [When To Create A Module](#when-to-create-a-module)
    - [Updating Modules](#updating-modules)
  - [Version Pinning](#version-pinning)

For basic syntax style which can be enforced using `terraform fmt`,
[see the hashicorp style guide](https://www.terraform.io/language/syntax/style)

Additionally we follow some extra conventions below:

## General

### 120 Column Limit

We follow a 120 column line-length limit, except for description strings in variable and output blocks, where single
line strings are preferred.

### Use `snake_case` Labels

The label for blocks should be in snake case. E.g. `example_instance`, not `ExampleInstance` or `example-instance`.

Labels are the strings that follow block names. For example, in the following, `aws_instance` and `example_instance` are
labels for the resource block.

```terraform
resource "aws_instance" "example_instance" {
  # Omitted for brevity
}
```

This includes `variables` and `outputs` as well:

```terraform
variable "vpc_id" {}
output "instance_name" {}
```

### Conditionals

If your conditional is longer than `120` characters, break it up across multiple lines using `()`. E.g.:

```terraform
locals {
  excluded_child_account_ids = (
    var.config_create_account_rules
    ? []
    : [
      for account_name, account in module.organization.child_accounts
      : account.id if lookup(lookup(var.child_accounts, account_name, {}), "enable_config_rules", false) == false
    ]
  )
}
```

### Conditional Resources

To instantiate a resource conditionally, use the count meta-argument. For example:

```hcl
variable "readers" {
  description = "..."
  type        = list
  default     = []
}

resource "resource_type" "reference_name" {
  // Do not create this resource if the list of readers is empty.
  count = length(var.readers) == 0 ? 0 : 1
  ...
}
```

be sparing when using user-specified variables to set the count variable for resources. If a resource attribute
is provided for such a variable (like `project_id`) and that resource does not yet exist, Terraform can't generate
a plan. Instead, Terraform reports the error value of count cannot be computed. In such cases, use a separate `enable_x`
variable to compute the conditional logic.

### Prefer Using Locals

If you reuse a value multiple times in a terraform configuration, create a `local` for it in a `locals.tf` file.

### Breaking Up Files

It is preferred if you can break up resources into collections of related resources (e.g. `compute` or `networking`).
Sometimes this is not possible to do logically, in which case you can split files into individual resource types.

<!-- TODO: I think we should pick one or the other here. I am a fan of the collection route -->

**Collection**
For example, all ec2 instances should go into a `compute.tf` file and all s3
buckets should go in a `persistance.tf` file.

All files within a directory get compiled together when terraform is run.

**Per resource**
For example, all ec2 instances would go into the `ec2.tf` file and all s3 buckets
would go into the `s3.tf`.

## Structure

### variables.tf

Variables are used for modules that have inputs. For example, a module that creates a cloudfront distribution, s3 bucket,
and a lambda function might have an input that sets the name of these items. All variables for a terraform module should
be defined in a `variables.tf` file.

Each `variable` block should always define a `description` and `type`. E.g.:

```terraform
variable "example" {
  description = "This is an example"
  type        = string
  default     = "example"  # NOTE: this is optional
}
```

Prefer concrete objects (`object` type) over free-form maps. E.g.:

```terraform
variable "myvar" {
  type = object({
    attr1 = string
    attr2 = string
    attr3 = string
  })
}
```

### outputs.tf

All outputs of a terraform module should be defined in an `outputs.tf` file.

Each `output` block should always define a `description`, before the `value`:

```terraform
output "greeting" {
  description = "This is a greeting for everyone."
  value       = "hello world!"
}
```

### locals.tf

All locals should be defined in an `locals.tf` file. Since all files in a terraform project are merged together upon
planning and applying, scattering locals across files can create collisions. Centralizing locals ensures that locals
are unique in a project and gives a single place to find all locals.

### terraform_config.tf

A terraform project requires creating a [`terraform` block of configuration](https://developer.hashicorp.com/terraform/language/settings).
This block should go in a file called `terraform_config.tf` and should contain the following:

1. [backend remote state](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
2. [terraform version](https://developer.hashicorp.com/terraform/language/settings#specifying-a-required-terraform-version)
3. [required providers](https://developer.hashicorp.com/terraform/language/settings#specifying-provider-requirements)
4. provider configurations

Example configuration:

```terraform
terraform {
  backend "s3" {
    encrypt        = true
    bucket         = "terraform-state-swe-production.*company-data-covered*"
    dynamodb_table = "terraform-state-lock"
    key            = "jira/terraform.tfstate"
    region         = "us-east-1"
    role_arn       = "arn:aws:iam::651625208281:role/TerraformAdmin"
  }
  required_version = ">= 1.0"
  required_providers {
    aws = {
      version = "~> 4.20"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  assume_role {
    role_arn = "arn:aws:iam::329245343759:role/TerraformAdmin"
  }
}
```

### data.tf

Sometimes, you might need to look up information about a resource using a data source. These data sources should be put
in a `data.tf` file so that all lookups are centralized.

There might be exceptions to this rule. For example, if you are using a secret to configure a provider, that secret
data source can be put in the `providers.tf` file.

## Secrets

Secrets should not be committed in terraform code. Instead, secrets should be retrieved from a vault or secret manager,
provided through environment variables, or provided through the command line.

## State

State files (`terraform.tfstate`) should never be committed to a repository. These state files contain secrets in plain
text. Instead you should always use encrypted remote state backed by S3 and dynamoDB. See
[the `terraform_config.tf` section](#terraform_configtf) for how to set this up

## Modules

<!-- Much of this section is ripped right from the terraform docs: https://www.terraform.io/language/modules/develop -->

A module is a container for multiple resources that are used together. Modules can be used to create lightweight
abstractions, so that you can describe your infrastructure in terms of its architecture, rather than directly in terms
of physical objects.

### When To Create A Module

In principle any combination of resources and other constructs can be factored out into a module, but over-using
modules can make your overall Terraform configuration harder to understand and maintain.

A good module should raise the level of abstraction by describing a new concept in your architecture that is constructed
from resource types offered by providers. For example, we might create a module that creates a cloudfront instance,
s3 bucket, and lambda instance as a quickstart infrastructure module.

The important thing to remember when creating a module is that a module should raise the level of abstraction.

### Updating Modules

Modules are designed to be used in multiple places so updating them has far-reaching consequences. Currently, there is
no versioning of modules so a change is automatically propagated to the next `apply`. Atlantis does not auto plan when a
module is changed, so a change to a module will only show up when a project that uses that module is updated.

When changing a module, it is recommended to search for its usage across all terraform directories and move a line around
to force atlantis to run a plan for the projects that use the module.

Changes should avoid triggering resource destruction and maintain backwards compatability as much as possible.

## Version Pinning

As a best practice, pin the version and source of all providers by defining them in the `terraform.required_providers`
block, e.g.:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>4.23.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~>4.30.0"
    }
    ...etc.
  }
}
```

Per [Terraform: Version Constraints](https://www.terraform.io/language/expressions/version-constraints#terraform-core-and-provider-versions)
best practices, we pin versions with the pessimistic constraint: `~>`

Pinning protects us from possible harmful changes or inconsistencies between local and remote terraform steps.
