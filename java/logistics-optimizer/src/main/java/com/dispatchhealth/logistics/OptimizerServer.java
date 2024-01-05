package com.*company-data-covered*.logistics;

import static net.logstash.logback.argument.StructuredArguments.entries;
import static net.logstash.logback.argument.StructuredArguments.keyValue;

import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.*company-data-covered*.logistics.solver.SolutionFactory;
import com.*company-data-covered*.optimizer.AssignableShiftTeam;
import com.*company-data-covered*.optimizer.AssignableShiftTeamResult;
import com.*company-data-covered*.optimizer.AssignableVisit;
import com.*company-data-covered*.optimizer.AssignableVisitResult;
import com.*company-data-covered*.optimizer.GetAssignableShiftTeamsRequest;
import com.*company-data-covered*.optimizer.GetAssignableShiftTeamsResponse;
import com.*company-data-covered*.optimizer.GetAssignableVisitsRequest;
import com.*company-data-covered*.optimizer.GetAssignableVisitsResponse;
import com.*company-data-covered*.optimizer.Monitoring;
import com.*company-data-covered*.optimizer.OptimizerMetadata;
import com.*company-data-covered*.optimizer.OptimizerServiceGrpc;
import com.*company-data-covered*.optimizer.SolveVRPRequest;
import com.*company-data-covered*.optimizer.SolveVRPResponse;
import com.*company-data-covered*.optimizer.VRPConfig;
import com.*company-data-covered*.optimizer.VRPConfig.TerminationType;
import com.*company-data-covered*.optimizer.VRPDescription;
import com.google.common.base.Strings;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.protobuf.services.ProtoReflectionService;
import io.grpc.stub.StreamObserver;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.influxdb.InfluxDB;
import org.influxdb.dto.Point;
import org.influxdb.dto.Point.Builder;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;
import org.optaplanner.core.api.solver.SolutionManager;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.localsearch.LocalSearchPhaseConfig;
import org.optaplanner.core.config.phase.PhaseConfig;
import org.optaplanner.core.config.solver.SolverConfig;
import org.optaplanner.core.config.solver.termination.TerminationConfig;
import org.optaplanner.core.impl.solver.DefaultSolver;
import org.optaplanner.core.impl.solver.scope.SolverScope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OptimizerServer {
  private static final Logger LOGGER = LoggerFactory.getLogger(OptimizerServer.class.getName());

  public static final String DEFAULT_SOLVER_CONFIG_XML = "solverConfig.xml";
  private static final Duration DEFAULT_TERMINATION_DURATION = Duration.ofMillis(100);
  private static final long DEFAULT_RANDOM_SEED = 0;

  private final int port;
  private final Server server;

  public OptimizerServer(int port, InfluxDB influxDB, OptimizerMetadata metadata) {
    this(ServerBuilder.forPort(port), port, influxDB, metadata);
  }

  public OptimizerServer(
      ServerBuilder<?> serverBuilder, int port, InfluxDB influxDB, OptimizerMetadata metadata) {
    this.port = port;
    this.server =
        serverBuilder
            .addService(new OptimizerService(influxDB, metadata))
            .addService(ProtoReflectionService.newInstance())
            .build();
  }

  public void start() throws IOException {
    server.start();
    LOGGER.info("Started GRPC server on port: " + port);
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread() {
              @Override
              public void run() {
                // Use stderr here since the logger may have been reset by its JVM shutdown hook.
                System.err.println("*** shutting down gRPC server since JVM is shutting down");
                try {
                  OptimizerServer.this.stop();
                } catch (InterruptedException e) {
                  e.printStackTrace(System.err);
                }
                System.err.println("*** server shut down");
              }
            });
  }

  /** Stop serving requests and shutdown resources. */
  public void stop() throws InterruptedException {
    if (server != null) {
      server.shutdown().awaitTermination(30, TimeUnit.SECONDS);
    }
  }

  /** Await termination on the main thread since the grpc library uses daemon threads. */
  public void blockUntilShutdown() throws InterruptedException {
    if (server != null) {
      server.awaitTermination();
    }
  }

  public static class Stats {
    final long startTimestampMs;
    final Monitoring monitoring;
    AtomicInteger intermediateSolutions = new AtomicInteger();
    AtomicBoolean hasError = new AtomicBoolean(false);
    long terminationDurationMs = 0;
    long unimprovedScoreTerminationDurationMs = 0;
    TerminationType terminationType = TerminationType.TERMINATION_TYPE_UNSPECIFIED;
    int numVisits = 0;
    int numPlanningVisits = 0;
    int numPlanningRestBreaks = 0;
    int numShiftTeams = 0;

    AtomicLong scoreCalculations = new AtomicLong();
    AtomicLong scoreCalculationsPerSec = new AtomicLong();
    AtomicLong bestScoreTimeSpentMs = new AtomicLong();

    public Stats(long startTimestampMs, Monitoring monitoring) {
      this.startTimestampMs = startTimestampMs;
      this.monitoring = monitoring;
    }
  }

  public static class OptimizerService extends OptimizerServiceGrpc.OptimizerServiceImplBase {
    final InfluxDB influxDB;
    final OptimizerMetadata metadata;
    final boolean showDebugVRPRequests;
    final String solverConfigXml;

    public OptimizerService(InfluxDB influxDB, OptimizerMetadata metadata) {
      this.influxDB = influxDB;
      this.metadata = metadata;
      this.showDebugVRPRequests = "true".equals(System.getenv("ENABLE_DEBUG_VRP_REQUESTS"));
      String configXml = DEFAULT_SOLVER_CONFIG_XML;
      String envConfigXml = System.getenv("SOLVER_CONFIG_XML");
      if (!Strings.isNullOrEmpty(envConfigXml)) {
        configXml = envConfigXml;
      }

      this.solverConfigXml = configXml;
      LOGGER.info("Using solver config {}", keyValue("file", this.solverConfigXml));
    }

    @Override
    public void solveVRP(
        SolveVRPRequest request, StreamObserver<SolveVRPResponse> responseObserver) {
      Monitoring monitoring = request.getMonitoring();

      if (showDebugVRPRequests) {
        try {
          String description = JsonFormat.printer().preservingProtoFieldNames().print(request);
          LOGGER.info(
              "SolveVRP: {} {}", entries(monitoring.getTagsMap()), keyValue("req", description));
        } catch (InvalidProtocolBufferException e) {
          // ignored.
        }
      } else {
        LOGGER.info("SolveVRP {}", entries(monitoring.getTagsMap()));
      }

      final Stats stats = new Stats(System.currentTimeMillis(), monitoring);

      VRPDescription description = request.getProblem().getDescription();
      try {
        VRPConfig vrpConfig = request.getConfig();

        TerminationType terminationType = vrpConfig.getTerminationType();
        stats.terminationType = terminationType;

        VehicleRoutingSolution vehicleRoutingSolution;
        try {
          vehicleRoutingSolution =
              SolutionFactory.fromVRPDescription(
                  description, DefaultProfitComponents.fromVRPConfig(vrpConfig));
          vehicleRoutingSolution.setConstraintConfiguration(
              SolutionFactory.constraintConfigFromVRPConfig(
                  vrpConfig, description.getVisitsCount(), description.getCurrentTimestampSec()));

          SolutionFactory.recalculateArrivalTimestamps(vehicleRoutingSolution);

          stats.numVisits = vehicleRoutingSolution.getCustomerVisitList().size();
          stats.numPlanningVisits = vehicleRoutingSolution.numPlanningVisits();
          stats.numPlanningRestBreaks = vehicleRoutingSolution.numPlanningRestBreaks();
          stats.numShiftTeams = vehicleRoutingSolution.getVehicleList().size();
        } catch (IllegalArgumentException | IllegalStateException e) {
          e.printStackTrace();

          LOGGER.warn(
              "Bad SolveVRP request {} {}", keyValue("req", description), keyValue("err", e));

          responseObserver.onError(
              new StatusRuntimeException(
                  Status.INVALID_ARGUMENT.withCause(e).withDescription(e.getMessage())));
          stats.hasError.set(true);
          return;
        }

        SolverConfig solverConfig = SolverConfig.createFromXmlResource(this.solverConfigXml);
        LocalSearchPhaseConfig localSearchPhaseConfig = null;
        for (PhaseConfig phaseConfig : solverConfig.getPhaseConfigList()) {
          if (phaseConfig instanceof LocalSearchPhaseConfig) {
            localSearchPhaseConfig = (LocalSearchPhaseConfig) phaseConfig;
            break;
          }
        }
        if (localSearchPhaseConfig == null) {
          String msg = "Solver config is missing a LocalSearchPhaseConfig";
          LOGGER.error(msg);

          responseObserver.onError(
              new StatusRuntimeException(Status.INTERNAL.withDescription(msg)));
          stats.hasError.set(true);
          return;
        }

        TerminationConfig localPhaseTerminationConfig =
            localSearchPhaseConfig.getTerminationConfig();
        if (localPhaseTerminationConfig == null) {
          localPhaseTerminationConfig = new TerminationConfig();
          localSearchPhaseConfig.setTerminationConfig(localPhaseTerminationConfig);
        }

        Duration terminationDuration = DEFAULT_TERMINATION_DURATION;
        if (vrpConfig.hasTerminationDurationMs()) {
          terminationDuration = Duration.ofMillis(vrpConfig.getTerminationDurationMs());
        }

        long unimprovedScoreTerminationDurationMs =
            vrpConfig.getUnimprovedScoreTerminationDurationMs();
        if (unimprovedScoreTerminationDurationMs > 0) {
          Duration unimprovedScoreDuration =
              Duration.ofMillis(unimprovedScoreTerminationDurationMs);
          localPhaseTerminationConfig.withUnimprovedSpentLimit(unimprovedScoreDuration);

          stats.unimprovedScoreTerminationDurationMs = unimprovedScoreDuration.toMillis();
        }

        boolean includeIntermediate = vrpConfig.getIncludeIntermediateSolutions();
        if (terminationType.equals(TerminationType.TERMINATION_TYPE_FIRST_FEASIBLE)) {
          includeIntermediate = false;

          localPhaseTerminationConfig.withBestScoreFeasible(true);
        }

        stats.terminationDurationMs = terminationDuration.toMillis();

        long randomSeed = DEFAULT_RANDOM_SEED;
        if (vrpConfig.hasRandomSeed()) {
          randomSeed = vrpConfig.getRandomSeed();
        }

        SolverFactory<VehicleRoutingSolution> solverFactory =
            SolverFactory.create(
                solverConfig
                    .withTerminationSpentLimit(terminationDuration)
                    .withRandomSeed(randomSeed));

        SolutionManager<VehicleRoutingSolution, BendableLongScore> solutionManager =
            SolutionManager.create(solverFactory);

        DefaultSolver<VehicleRoutingSolution> solver =
            (DefaultSolver<VehicleRoutingSolution>) solverFactory.buildSolver();
        ExecutorService executorService = Executors.newSingleThreadExecutor();

        if (includeIntermediate) {
          boolean includeInfeasible = vrpConfig.getIncludeIntermediateInfeasibleSolutions();
          solver.addEventListener(
              bestSolutionChangedEvent -> {
                boolean feasible =
                    bestSolutionChangedEvent.getNewBestSolution().getScore().isFeasible();
                if (!feasible && !includeInfeasible) {
                  return;
                }
                SolveVRPResponse.Status status =
                    feasible
                        ? SolveVRPResponse.Status.STATUS_INTERMEDIATE_FEASIBLE_SOLUTION
                        : SolveVRPResponse.Status.STATUS_INTERMEDIATE_INFEASIBLE_SOLUTION;

                executorService.submit(
                    () ->
                        respondWithStatus(
                            status,
                            bestSolutionChangedEvent.getNewBestSolution(),
                            responseObserver,
                            vrpConfig,
                            solutionManager));
                stats.intermediateSolutions.incrementAndGet();
              });
        }

        VehicleRoutingSolution finalSolution = vehicleRoutingSolution;

        try {
          if (!vehicleRoutingSolution.hasNoDemand()) {
            finalSolution = solver.solve(vehicleRoutingSolution);
          }
        } catch (IllegalStateException e) {
          e.printStackTrace();
          responseObserver.onError(
              new StatusRuntimeException(
                  Status.INVALID_ARGUMENT.withCause(e).withDescription(e.getMessage())));
          stats.hasError.set(true);
          return;
        }

        SolverScope<VehicleRoutingSolution> solverScope = solver.getSolverScope();
        if (solverScope.getStartingSystemTimeMillis() != null) {
          stats.bestScoreTimeSpentMs.set(solverScope.getBestSolutionTimeMillisSpent());
          stats.scoreCalculations.set(solverScope.getScoreCalculationCount());
          stats.scoreCalculationsPerSec.set(solverScope.getScoreCalculationSpeed());
        }

        respondWithStatus(
            SolveVRPResponse.Status.STATUS_FINISHED,
            finalSolution,
            responseObserver,
            vrpConfig,
            solutionManager);
        responseObserver.onCompleted();

      } finally {
        long endTimestampMs = System.currentTimeMillis();
        if (influxDB != null) {
          Builder point =
              Point.measurement("solve_vrp")
                  .time(endTimestampMs, TimeUnit.MILLISECONDS)
                  .tag("status", stats.hasError.get() ? "error" : "success")
                  .tag("termination_type", stats.terminationType.name())
                  .tag("termination_duration_ms", String.valueOf(stats.terminationDurationMs))
                  .tag(
                      "unimproved_score_termination_duration_ms",
                      String.valueOf(stats.unimprovedScoreTerminationDurationMs))
                  .addField("duration_ms", endTimestampMs - stats.startTimestampMs)
                  .addField("intermediate_solutions", stats.intermediateSolutions.get())
                  .addField("visits", stats.numVisits)
                  .addField("planning_visits", stats.numPlanningVisits)
                  .addField("planning_rest_breaks", stats.numPlanningRestBreaks)
                  .addField("shift_teams", stats.numShiftTeams);
          stats.monitoring.getTagsMap().forEach(point::tag);

          if (!stats.hasError.get()) {
            point
                .addField("score_calculations", stats.scoreCalculations.get())
                .addField("score_calculations_per_sec", stats.scoreCalculationsPerSec.get())
                .addField("best_score_duration_ms", stats.bestScoreTimeSpentMs.get());
          }

          influxDB.write(point.build());
        }
      }
    }

    @Override
    public void getAssignableShiftTeams(
        GetAssignableShiftTeamsRequest request,
        StreamObserver<GetAssignableShiftTeamsResponse> responseObserver) {
      Monitoring monitoring = request.getMonitoring();
      LOGGER.info("getAssignableShiftTeams {}", entries(monitoring.getTagsMap()));

      final Stats stats = new Stats(System.currentTimeMillis(), monitoring);
      try {
        if (!request.hasVisit()) {
          responseObserver.onError(
              Status.INVALID_ARGUMENT.withDescription("Missing visit").asRuntimeException());
          stats.hasError.set(true);
          return;
        }

        AssignableVisit visit = request.getVisit();
        AssignabilityChecker checker = new AssignabilityChecker(visit);
        List<AssignableShiftTeam> shiftTeams = request.getShiftTeamsList();
        stats.numShiftTeams = shiftTeams.size();

        List<AssignableShiftTeamResult> assignableShiftTeamResults =
            shiftTeams.stream().map(checker::checkShiftTeam).toList();

        responseObserver.onNext(
            GetAssignableShiftTeamsResponse.newBuilder()
                .addAllShiftTeams(assignableShiftTeamResults)
                .build());
        responseObserver.onCompleted();
      } finally {
        long endTimestampMs = System.currentTimeMillis();
        if (influxDB != null) {
          Builder point =
              Point.measurement("get_assignable_shift_teams")
                  .time(endTimestampMs, TimeUnit.MILLISECONDS)
                  .tag("status", stats.hasError.get() ? "error" : "success")
                  .addField("duration_ms", endTimestampMs - stats.startTimestampMs)
                  .addField("shift_teams", stats.numShiftTeams);
          stats.monitoring.getTagsMap().forEach(point::tag);
          influxDB.write(point.build());
        }
      }
    }

    @Override
    public void getAssignableVisits(
        GetAssignableVisitsRequest request,
        StreamObserver<GetAssignableVisitsResponse> responseObserver) {
      Monitoring monitoring = request.getMonitoring();
      LOGGER.info("getAssignableVisits {}", entries(monitoring.getTagsMap()));

      final Stats stats = new Stats(System.currentTimeMillis(), monitoring);
      try {
        if (!request.hasShiftTeam()) {
          responseObserver.onError(
              Status.INVALID_ARGUMENT.withDescription("Missing shift team").asRuntimeException());
          stats.hasError.set(true);
          return;
        }

        AssignableShiftTeam shiftTeam = request.getShiftTeam();
        List<AssignableVisit> visits = request.getVisitsList();
        List<AssignableVisitResult> assignableVisitsResult =
            new ArrayList<AssignableVisitResult>(visits.size());

        for (AssignableVisit visit : visits) {
          AssignabilityChecker checker = new AssignabilityChecker(visit);
          AssignableShiftTeamResult result = checker.checkShiftTeam(shiftTeam);
          assignableVisitsResult.add(checker.visitResultFromShiftTeamResult(result, visit));
        }

        responseObserver.onNext(
            GetAssignableVisitsResponse.newBuilder().addAllVisits(assignableVisitsResult).build());
        responseObserver.onCompleted();

      } finally {
        long endTimestampMs = System.currentTimeMillis();
        if (influxDB != null) {
          Builder point =
              Point.measurement("get_assignable_visits")
                  .time(endTimestampMs, TimeUnit.MILLISECONDS)
                  .tag("status", stats.hasError.get() ? "error" : "success")
                  .addField("duration_ms", endTimestampMs - stats.startTimestampMs)
                  .addField("visits", stats.numVisits);
          stats.monitoring.getTagsMap().forEach(point::tag);
          influxDB.write(point.build());
        }
      }
    }

    private void respondWithStatus(
        SolveVRPResponse.Status status,
        VehicleRoutingSolution solution,
        StreamObserver<SolveVRPResponse> responseObserver,
        VRPConfig vrpConfig,
        SolutionManager<VehicleRoutingSolution, BendableLongScore> solutionManager) {
      SolveVRPResponse.Builder vrpResponse =
          SolveVRPResponse.newBuilder()
              .setStatus(status)
              .setOptimizerMetadata(metadata)
              .setSolution(
                  SolutionFactory.toVRPSolution(
                      solution, solutionManager, vrpConfig.getIncludeDistanceMatrix(), true));

      responseObserver.onNext(vrpResponse.build());
    }
  }
}
