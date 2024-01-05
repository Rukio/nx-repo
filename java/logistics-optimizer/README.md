# Logistics Optimizer

The Logistics Optimizer runs various optimization problems for the company, including matching service providers with patients.

The underlying technology uses [Optaplanner](https://www.optaplanner.org/) to do the actual optimization.

### Important files and documentation

- [Domain description](src/main/java/com/*company-data-covered*/logistics/domain/) - domain models for the problem
  - [Modeling reference](https://www.optaplanner.org/docs/optaplanner/latest/planner-configuration/planner-configuration.html#modelAPlanningProblem)
  - [VehicleRoutingSolution](src/main/java/com/*company-data-covered*/logistics/domain/VehicleRoutingSolution.java) - `PlanningSolution` to structure the planning problem
- [Solver](src/main/java/com/*company-data-covered*/logistics/solver/) - optimizing solver for the problem
  - [Constraint provider reference](https://www.optaplanner.org/docs/optaplanner/latest/constraint-streams/constraint-streams.html)
  - [VehicleRoutingConstraintProvider](src/main/java/com/*company-data-covered*/logistics/solver/VehicleRoutingConstraintProvider.java) - objective function to optimize
