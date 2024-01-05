# Contexts

Many commands and jobs have expected environment variables. Contexts are entities in circleci that contain environment variables at an organizational or project level. These allow shared sets of secrets under a specified scope. Keep in mind, contexts can only be passed to jobs.

### Providing context to an orb job

Providing a context to a job:

```yml
workflows:
  my_workflow:
    jobs:
      - aptible/deploy:
          aptible_app_name: my_app
          docker_image: registry.*company-data-covered*.com/my_image:0.0.1
          context:
            - DH_REGISTRY
            - APTIBLE_ROBOTS
```

### Providing context to an orb command

To provide a command with a context, we must define a job that uses the command and provide the context to the job:

```yml
jobs:
  my_job:
    docker:
      - image: cimg/base:current
    steps:
      - aptible/setup
workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - APTIBLE_ROBOTS
```
