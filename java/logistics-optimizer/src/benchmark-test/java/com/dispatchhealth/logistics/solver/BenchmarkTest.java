package com.*company-data-covered*.logistics.solver;

import com.*company-data-covered*.logistics.OptimizerServer;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.optimizer.SolveVRPRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.optaplanner.benchmark.api.PlannerBenchmark;
import org.optaplanner.benchmark.api.PlannerBenchmarkFactory;
import org.optaplanner.benchmark.config.PlannerBenchmarkConfig;
import org.optaplanner.benchmark.config.SolverBenchmarkConfig;
import org.optaplanner.core.config.constructionheuristic.ConstructionHeuristicPhaseConfig;
import org.optaplanner.core.config.localsearch.LocalSearchPhaseConfig;
import org.optaplanner.core.config.phase.PhaseConfig;
import org.optaplanner.core.config.solver.SolverConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BenchmarkTest {

  private static final Logger LOGGER = LoggerFactory.getLogger(BenchmarkTest.class.getName());

  public static final String BENCHMARK_DIRECTORY = "src/benchmark-test/resources/benchmarks";
  public static final String PLANNER_BENCHMARK_CONFIG_FILE =
      Paths.get(BENCHMARK_DIRECTORY, "planner-benchmark.xml").toString();
  public static final Duration BENCHMARK_DURATION = Duration.of(5, ChronoUnit.SECONDS);

  VehicleRoutingSolution solutionFromJsonFile(String filename) throws IOException {

    String jsonString = new String(Files.readAllBytes(Paths.get(filename)));
    SolveVRPRequest requestFromJson = SolutionFactory.solveRequestFromJson(jsonString);
    VehicleRoutingSolution vehicleRoutingSolution = SolutionFactory.fromVRPRequest(requestFromJson);

    SolutionFactory.recalculateArrivalTimestamps(vehicleRoutingSolution);
    return vehicleRoutingSolution;
  }

  @Test
  void runBenchmark() {
    String solverXML = OptimizerServer.DEFAULT_SOLVER_CONFIG_XML;
    SolverConfig baseSolverConfig =
        SolverConfig.createFromXmlResource(solverXML).withTerminationSpentLimit(BENCHMARK_DURATION);

    // Set only construction configs, since PLANNER_BENCHMARK_CONFIG_FILE will append
    // various LocalSearch configs instead of overwrite..
    List<PhaseConfig> origPhaseConfigs = baseSolverConfig.getPhaseConfigList();
    List<PhaseConfig> constructionPhaseConfigs =
        origPhaseConfigs.stream()
            .filter(phaseConfig -> (phaseConfig instanceof ConstructionHeuristicPhaseConfig))
            .toList();
    baseSolverConfig.setPhaseConfigList(constructionPhaseConfigs);

    List<PhaseConfig> localPhaseConfigs =
        origPhaseConfigs.stream()
            .filter(phaseConfig -> phaseConfig instanceof LocalSearchPhaseConfig)
            .toList();

    SolverConfig origConfig = new SolverConfig();
    origConfig.setPhaseConfigList(localPhaseConfigs);
    SolverBenchmarkConfig origSolverBenchmarkConfig = new SolverBenchmarkConfig();
    origSolverBenchmarkConfig.setName(solverXML);
    origSolverBenchmarkConfig.setSolverConfig(origConfig);

    List<SolverBenchmarkConfig> solverBenchmarkConfigs = new ArrayList<>();
    solverBenchmarkConfigs.add(origSolverBenchmarkConfig);
    solverBenchmarkConfigs.addAll(
        PlannerBenchmarkConfig.createFromXmlFile(new File(PLANNER_BENCHMARK_CONFIG_FILE))
            .getSolverBenchmarkConfigList());

    LOGGER.info(
        "Solver benchmark configs {}",
        solverBenchmarkConfigs.stream().map(SolverBenchmarkConfig::getName).toList());

    PlannerBenchmarkConfig plannerBenchmarkConfig =
        PlannerBenchmarkConfig.createFromSolverConfig(baseSolverConfig);
    plannerBenchmarkConfig.setSolverBenchmarkConfigList(solverBenchmarkConfigs);

    Path tempDirectory = null;
    try {
      tempDirectory = Files.createTempDirectory("benchmark");
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    plannerBenchmarkConfig.setBenchmarkDirectory(tempDirectory.toFile());
    PlannerBenchmarkFactory benchmarkFactory =
        PlannerBenchmarkFactory.create(plannerBenchmarkConfig);

    List<VehicleRoutingSolution> problems = null;
    try {
      problems =
          Files.walk(Paths.get(BENCHMARK_DIRECTORY))
              .filter(path -> Files.isRegularFile(path) && path.toString().endsWith(".json"))
              .sorted()
              .map(
                  path -> {
                    try {
                      return solutionFromJsonFile(path.toString());
                    } catch (IOException e) {
                      throw new RuntimeException(e);
                    }
                  })
              .toList();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    PlannerBenchmark benchmark = benchmarkFactory.buildPlannerBenchmark(problems);
    benchmark.benchmarkAndShowReportInBrowser();
  }
}
