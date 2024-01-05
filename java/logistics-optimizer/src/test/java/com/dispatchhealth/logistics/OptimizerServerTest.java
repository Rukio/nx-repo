package com.*company-data-covered*.logistics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.*company-data-covered*.logistics.OptimizerServer.OptimizerService;
import com.*company-data-covered*.optimizer.OptimizerMetadata;
import com.*company-data-covered*.optimizer.SolveVRPRequest;
import com.*company-data-covered*.optimizer.SolveVRPResponse;
import com.*company-data-covered*.optimizer.VRPConfig;
import com.*company-data-covered*.optimizer.VRPDescription;
import com.*company-data-covered*.optimizer.VRPDistance;
import com.*company-data-covered*.optimizer.VRPDistanceMatrix;
import com.*company-data-covered*.optimizer.VRPLocation;
import com.*company-data-covered*.optimizer.VRPProblem;
import com.*company-data-covered*.optimizer.VRPShiftTeam;
import com.*company-data-covered*.optimizer.VRPShiftTeamCommitments;
import com.*company-data-covered*.optimizer.VRPShiftTeamPosition;
import com.*company-data-covered*.optimizer.VRPShiftTeamRoute;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteHistory;
import com.*company-data-covered*.optimizer.VRPSolution;
import com.*company-data-covered*.optimizer.VRPStats;
import com.*company-data-covered*.optimizer.VRPTimeWindow;
import com.google.common.collect.ImmutableList;
import io.grpc.stub.StreamObserver;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

public class OptimizerServerTest {
  int depotLocationId = 1;

  VRPShiftTeamPosition currentPosition =
      VRPShiftTeamPosition.newBuilder()
          .setLocationId(depotLocationId)
          .setKnownTimestampSec(0)
          .build();

  VRPLocation depotLocation =
      VRPLocation.newBuilder()
          .setId(depotLocationId)
          .setLatitudeE6(123456)
          .setLongitudeE6(456789)
          .build();

  VRPShiftTeam shiftTeam =
      VRPShiftTeam.newBuilder()
          .setId(2)
          .setDepotLocationId(depotLocationId)
          .setRoute(VRPShiftTeamRoute.newBuilder().setCurrentPosition(currentPosition))
          .setRouteHistory(
              VRPShiftTeamRouteHistory.newBuilder().setCurrentPosition(currentPosition))
          .setUpcomingCommitments(VRPShiftTeamCommitments.newBuilder())
          .setAvailableTimeWindow(
              VRPTimeWindow.newBuilder().setStartTimestampSec(10).setEndTimestampSec(20))
          .setNumAppMembers(1)
          .setNumDhmtMembers(2)
          .build();

  OptimizerMetadata optimizerMetadata =
      OptimizerMetadata.newBuilder().setVersion("test_version").build();

  VRPDistanceMatrix getNaiveDistanceMatrixForLocations(List<VRPLocation> locations) {
    VRPDistanceMatrix.Builder distanceMatrix = VRPDistanceMatrix.newBuilder();
    for (int i = 0; i < locations.size(); i++) {
      for (int j = 0; j < locations.size(); j++) {
        VRPDistance.Builder distance =
            VRPDistance.newBuilder()
                .setFromLocationId(locations.get(i).getId())
                .setToLocationId(locations.get(j).getId())
                .setDurationSec(1)
                .setLengthMeters(1);
        if (i == j) {
          distance.setDurationSec(0).setLengthMeters(0);
        }
        distanceMatrix.addDistances(distance.build());
      }
    }
    return distanceMatrix.build();
  }

  @Test
  void solveVRP_noDemandReturnsEmptySchedules() {
    @SuppressWarnings("unchecked")
    StreamObserver<SolveVRPResponse> observer = mock(StreamObserver.class);

    OptimizerService optimizerService =
        new OptimizerServer.OptimizerService(null, optimizerMetadata);
    List<VRPShiftTeam> shiftTeams = ImmutableList.of(shiftTeam);
    List<VRPLocation> locations = ImmutableList.of(depotLocation);

    VRPDescription.Builder defaultDescription =
        VRPDescription.newBuilder()
            .addAllLocations(locations)
            .setDistanceMatrix(getNaiveDistanceMatrixForLocations(locations))
            .addAllShiftTeams(shiftTeams);

    SolveVRPRequest requestWithoutDemand =
        SolveVRPRequest.newBuilder()
            .setProblem(VRPProblem.newBuilder().setDescription(defaultDescription.build()))
            .setConfig(VRPConfig.newBuilder().setIncludeDistanceMatrix(true))
            .build();

    optimizerService.solveVRP(requestWithoutDemand, observer);
    verify(observer, times(1)).onCompleted();
    ArgumentCaptor<SolveVRPResponse> captor = ArgumentCaptor.forClass(SolveVRPResponse.class);
    verify(observer, times(1)).onNext(captor.capture());
    SolveVRPResponse response = captor.getValue();

    defaultDescription.setShiftTeams(
        0,
        defaultDescription.getShiftTeams(0).toBuilder()
            .setRoute(
                VRPShiftTeamRoute.newBuilder()
                    .setDepotArrivalTimestampSec(10)
                    .setDepotDepartureTimestampSec(10)
                    .setCurrentPosition(currentPosition)));

    // TODO: this test is clearly broken.  It is not short-circuiting the action like it should be.
    // Which is probably why we're still seeing the issues in production for "short circuiting
    // selector to prevent infinite loop".
    assertThat(response)
        .isEqualTo(
            SolveVRPResponse.newBuilder()
                .setStatus(SolveVRPResponse.Status.STATUS_FINISHED)
                .setOptimizerMetadata(optimizerMetadata)
                .setSolution(
                    VRPSolution.newBuilder()
                        .setDescription(defaultDescription)
                        .setTotalStats(
                            VRPStats.newBuilder().setDriveDurationSec(0).setDriveDistanceMeters(0)))
                .build());
  }
}
