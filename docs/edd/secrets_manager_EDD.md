# EDD: Brief Summary of Design

**Author:** Kyle McGrew

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Resources

- Relates to: [IDP Orchestrator EDD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EWnfKJz_cTRPmpyb7DpO_x0BTkL-DOfQPg5JW1rTcg8I7Q?e=TD3Pts)

- [What is Vault](https://developer.hashicorp.com/vault/docs/what-is-vault)
- [Vault Sidecar Injector](https://developer.hashicorp.com/vault/docs/platform/k8s/injector)

## Overview

For the Internal Developer Platofrm (IDP) we need a secrets manager for managing and injecting secrets across multiple services. Secrets management should also be considered by other services and apps that operate outside of the IDP.

A secrets manager is a tool that helps organizations securely store, manage, and distribute sensitive information such as passwords, API keys, certificates, and other credentials. These types of secrets are typically used by applications and infrastructure components to authenticate and authorize access to other systems or resources.

## Goals

The key goals of the secrets management system are as follows:

- **Secure storage**: A secrets management system should provide a secure way to store sensitive information such as passwords, API keys, and certificates. This information should be encrypted and protected from unauthorized access.

- **Access control**: The system should have access controls in place to ensure that only authorized individuals or applications can access the secrets. This includes features such as role-based access control and multi-factor authentication.

- **Audit trails**: The system should maintain audit trails of all access and changes to secrets, including who accessed or modified them and when.

- **Rotation and expiration**: The system should support regular rotation of secrets and expiration of unused secrets to reduce the risk of unauthorized access.

- **Integration with other systems**: The secrets management system should integrate with other systems such as container orchestration platforms, configuration management tools, and CI/CD pipelines to automate the deployment and management of secrets.

## Design Proposals

### Proposal #1 – Hashicorp Vault (Recommended)

#### Proposal

- Will be a service running on the platform eks cluster
- Developers will authenticate through SSO (Azure AD)
- Services will authenticate with a dedicated vault token that will be stored as an environment variable
- Service configurations and policy management will be done through terraform

![Vault Diagram](./images/vault_connection_diagram.png 'Vault Diagram')

##### Pros

- This will allow us to manage secret sprawl, as currently, we have secrets stored in numerous locations throughout the organization.
- User authentication can be handled through SSO, eliminating the need for users to have an additional account (such as an aws account) for managing secrets.
- Secret Policies can be managed through terraform, allowing easy management of secrets access across all services and users.
- Allows the use of dynamic secrets. This helps control sprawl and to keep track of who, when, and what a user is doing. It also protects us from leaking credentials causing damage to the organization as the generated secrets can be configured to last however long we define.
- Secrets can be accessed through API, CLI, or a dedicated UI, allowing for numerous ways to retrieve secrets
- Open source so no additional costs beyond the resources used in eks

##### Cons

- Another service that will need to be owned/managed.
- Will be an effort migrating existing secrets over to the new service.

### Consideration – AWS Secrets Manager

The continued use of AWS Secrets manager was considered as well, but due to the need to manage IAM roles for users, manage policies that may require cross-account access, and not being cloud agnostic, vault will provide a cleaner way to manage secrets.

## Platform Components

#### Update Shared Secrets Library

The shared secrets library will be updated to support the retrieval of secrets from the secrets manager for the services repo. By default secrets will be loaded on boot, and this behavior can be configured to load secrets later if needed.

Utilize Agent Injector for k8s

For applications run within the IDP, the agent sidecar injector will be used to inject secrets into the pods.

## Metrics & Data Integration

The secrets manager will be instrumented with datadog, giving us easy access to metrics, and tracking user usage across multiple systems. Beyond the system performance of the pods themselves, datadog will also have insight into user request metrics and data, providing us an easy way of tracking how often and who accesses secrets within the manager.

## Error Handling & Alerting

The most common failure points of the secrets manager would be due to issues such as disk space, node networking, or performance issues from external storage options.
Most of these errors will be mitigated since the Kubernetes cluster will be monitoring for these conditions and pods will be updated as necessary while the secrets manager is deployed.
In addition, datadog will be configured to observe metrics to ensure the secrets manager is operating as intended.
If k8s is unable to recover failed nodes, the secrets managers operations logs will be available for additional troubleshooting.

## Data Design & Schema Changes

In the secrets manager, secrets are stored in paths. The paths will correlate to the environment or service that those secrets are intended for.

For example,

- environment secrets: <code>ENV/SECRET_NAME</code>
- Application secrets: <code>APP_NAME/SECRET_NAME</code>

## Security

The secrets manager will encrypt all traffic during routing and at rest, even traffic between nodes, so even if the pods were accessed directly, no secrets will be able to be compromised. Secrets access will be controlled by custom policies that will be managed through terraform. By default, no secret will be accessible unless explicit access is given.

In the case that the secrets manager or service is compromised, the secrets manager can be sealed, blocking all access to the secrets manager until the issue can be mitigated. Once the issue is resolved, the secrets manager can be unsealed and operations can continue.

## Audits and Logs

The secret manager has components to collectively keep a detailed log of all requests and responses to itself. The audit log contains every authenticated interaction with the manager, including errors. Most strings contained within requests and responses are hashed with a salt using HMAC-SHA256. The purpose of the hash is so that secrets aren't in plaintext within your audit logs. However, you're still able to check the value of secrets by generating HMACs yourself.

## Scalability

We have no concerns about scalability since the expected traffic for the secrets manager will come nowhere close to the limits of the k8s cluster.

## Cost

The secrets manager software is open source under the Mozilla Public License 2.0, so there will be no additional costs beyond the resources utilized on k8s.

## Testing

To validate that the secrets manager is working properly we will have the following test cases:

1. Validate users can authenticate to the vault server using their azure credentials.

2. Verify that authenticated users can read/write secrets based off the pre-established user policy.

3. Certify that secrets cannot be accessed by non-authenticated entities that do not have the proper policy permissions.

4. Certify that secrets cannot be accessed by authenticated entities that do not have the proper policy permissions.

## Training

Documentation will be provided within Confluence and the services repo to educate developers on how to interact with the secrets manager API.

## Deployment

The secrets manager will be deployed to the production platform EKS cluster in a TBD AWS account. We will document the process for migrating secrets from AWS secrets manager to the new key/value store.

The deployment will be managed through a helm chart, allowing for updates and configuration changes as needed.

The secrets themselves will be stored using S3 so no secrets data will be lost in the case that the secrets manager goes down and backups can be easily managed.

## Lifecycle management

Vault is not at risk of sunsetting and is under active development and maintenance by Hashicorp.
