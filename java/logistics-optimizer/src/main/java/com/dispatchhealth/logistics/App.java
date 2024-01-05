package com.*company-data-covered*.logistics;

import static net.logstash.logback.argument.StructuredArguments.keyValue;

import com.*company-data-covered*.optimizer.OptimizerMetadata;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.influxdb.BatchOptions;
import org.influxdb.InfluxDB;
import org.influxdb.InfluxDBFactory;
import org.influxdb.dto.Point;
import org.influxdb.dto.Pong;
import org.influxdb.dto.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class App {

  private static final Logger LOGGER = LoggerFactory.getLogger(App.class.getName());

  private static final String GRPC_PORT_ARG_NAME = "grpc-port";
  private static final String HEALTHCHECK_PORT_ARG_NAME = "healthcheck-port";
  private static final String HELP_ARG_NAME = "h";

  private static Options commandLineOptions() {
    Options options = new Options();

    options.addOption(Option.builder().option(HELP_ARG_NAME).desc("Print help").build());
    options.addOption(
        Option.builder()
            .longOpt(GRPC_PORT_ARG_NAME)
            .desc("GRPC Server port")
            .argName("port")
            .hasArg()
            .build());
    options.addOption(
        Option.builder()
            .longOpt(HEALTHCHECK_PORT_ARG_NAME)
            .desc("Healthcheck HTTP port")
            .argName("port")
            .hasArg()
            .build());

    return options;
  }

  private static class CLIFlags {
    int grpcPort = 8081;
    int healthCheckPort = 8181;
  }

  private static CLIFlags getCLIFlags(String[] args) {
    CommandLineParser parser = new DefaultParser();
    Options options = commandLineOptions();
    CommandLine line = null;
    try {
      line = parser.parse(options, args);
    } catch (ParseException e) {
      throw new IllegalArgumentException(e);
    }

    if (line.hasOption(HELP_ARG_NAME)) {
      new HelpFormatter().printHelp("logistics-optimizer", options);
      System.exit(0);
    }

    CLIFlags flags = new CLIFlags();

    if (line.hasOption(GRPC_PORT_ARG_NAME)) {
      String optionValue = line.getOptionValue(GRPC_PORT_ARG_NAME);
      try {
        flags.grpcPort = Integer.parseInt(optionValue);
      } catch (NumberFormatException e) {
        throw new IllegalArgumentException(
            "Bad argument: " + GRPC_PORT_ARG_NAME + " : Reason: " + e);
      }
    }

    if (line.hasOption(HEALTHCHECK_PORT_ARG_NAME)) {
      String optionValue = line.getOptionValue(HEALTHCHECK_PORT_ARG_NAME);
      try {
        flags.healthCheckPort = Integer.parseInt(optionValue);
      } catch (NumberFormatException e) {
        throw new IllegalArgumentException(
            "Bad argument: " + HEALTHCHECK_PORT_ARG_NAME + " : Reason: " + e);
      }
    }

    return flags;
  }

  public static InfluxDB getInfluxDB(String version, String javaVersion) {
    String influxUrl = System.getenv("INFLUXDB_URL");
    String influxDatabase = System.getenv("INFLUXDB_DATABASE");
    String influxUser = System.getenv("INFLUXDB_USER");
    String influxPassword = System.getenv("INFLUXDB_PASSWORD");

    if (influxDatabase == null || influxDatabase.isEmpty()) {
      LOGGER.info("Skipping influx setup.");

      return null;
    }

    LOGGER.info("Starting influx...");
    InfluxDB influxDB = InfluxDBFactory.connect(influxUrl, influxUser, influxPassword);
    Pong pong = influxDB.ping();
    if (!pong.isGood()) {
      LOGGER.warn("Could not ping influx");
      System.exit(2);
    }

    influxDB.query(new Query("CREATE DATABASE " + influxDatabase));
    influxDB.setDatabase(influxDatabase);

    influxDB.enableBatch(
        BatchOptions.DEFAULTS.threadFactory(
            runnable -> {
              Thread thread = new Thread(runnable);
              thread.setDaemon(true);
              return thread;
            }));
    Runtime.getRuntime().addShutdownHook(new Thread(influxDB::close));

    influxDB.write(
        Point.measurement("startup")
            .time(System.currentTimeMillis(), TimeUnit.MILLISECONDS)
            .addField("version", version)
            .addField("java", javaVersion)
            .addField("count", 1)
            .build());

    return influxDB;
  }

  private static String getVersion() {
    String version = null;

    try (InputStream input =
        App.class.getClassLoader().getResourceAsStream("application.properties")) {
      if (input == null) {
        System.err.println("Missing application.properties file.");
        System.exit(2);
      }

      Properties properties = new Properties();
      properties.load(input);

      String propVersion = properties.getProperty("version");
      if (propVersion != null) {
        version = propVersion;
      }
    } catch (IOException e) {
      e.printStackTrace();
    }

    if (version == null) {
      version = "dev";
    }

    return version;
  }

  public static void main(String[] args) {
    CLIFlags flags = null;
    try {
      flags = getCLIFlags(args);
    } catch (IllegalArgumentException e) {
      System.err.println("Argument parsing failed\n" + e.getMessage());
      System.exit(1);
    }

    final String version = getVersion();
    final String javaVersion = System.getProperty("java.version");
    LOGGER.info("Optimizer {} {}", keyValue("java", javaVersion), keyValue("version", version));

    InfluxDB influxDB = getInfluxDB(version, javaVersion);

    OptimizerMetadata metadata = OptimizerMetadata.newBuilder().setVersion(version).build();

    OptimizerServer logisticsServer = new OptimizerServer(flags.grpcPort, influxDB, metadata);
    HealthcheckServer healthcheckServer = new HealthcheckServer(flags.healthCheckPort, version);
    try {
      logisticsServer.start();
      healthcheckServer.start();
      logisticsServer.blockUntilShutdown();
    } catch (IOException e) {
      e.printStackTrace();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
  }
}
