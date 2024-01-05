# Using an orb

Add an `orbs` section to the CircleCI config and reference the orb needed like so:

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>
```

The orb is now available to use its commands/jobs:

**Command**

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>

jobs:
  my_job:
    docker:
      - image: <some_image>
    resource_class: <some_size>
    steps:
      - <orb_name>/<command>:
          <command_parameter1>: value1
          <command_parameter2>: value2

workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - <context_for_job1>
            - <context_for_job2>
```

**Job**

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>

workflows:
  my_workflow:
    jobs:
      - <orb_name>/<orb_job>:
          <orb_parameter1>: value1
          <orb_parameter2>: value2
          context:
            - <context_for_job1>
            - <context_for_job2>
```
