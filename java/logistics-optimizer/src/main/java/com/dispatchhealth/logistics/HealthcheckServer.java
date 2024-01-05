package com.*company-data-covered*.logistics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableMap;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.io.Serializable;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HealthcheckServer {

  private static final Logger LOGGER = LoggerFactory.getLogger(OptimizerServer.class.getName());
  private final int port;
  private final String version;
  private HttpServer server;

  public HealthcheckServer(int port, String version) {
    this.port = port;
    this.version = version;
  }

  public void start() throws IOException {
    this.server = HttpServer.create(new InetSocketAddress(this.port), 0);
    this.server.createContext("/healthcheck", new HealthcheckHandler());
    this.server.setExecutor(Executors.newSingleThreadExecutor());
    this.server.start();
    LOGGER.info("Started Healthcheck handler on http://0.0.0.0:" + this.port + "/healthcheck");
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread() {
              @Override
              public void run() {
                // Use stderr here since the logger may have been reset by its JVM shutdown hook.
                System.err.println("*** shutting down gRPC server since JVM is shutting down");
                try {
                  HealthcheckServer.this.stop();
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
      this.server.stop(1);
    }
  }

  class HealthcheckHandler implements HttpHandler {
    final ObjectMapper objectMapper;

    public HealthcheckHandler() {
      objectMapper = new ObjectMapper();
    }

    @Override
    public void handle(HttpExchange t) throws IOException {
      ImmutableMap<String, ? extends Serializable> val =
          ImmutableMap.of("optimizer", true, "version", version);

      String response = objectMapper.writeValueAsString(val);
      t.getResponseHeaders().add("Content-type", "application/json");
      t.sendResponseHeaders(200, response.length());
      OutputStream os = t.getResponseBody();
      os.write(response.getBytes());
      os.close();
    }
  }
}
